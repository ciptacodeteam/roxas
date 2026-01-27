/**
 * Email Queue Utilities
 * Add email jobs to Redis queue with priority and scheduling support
 */

import { Queue } from "bullmq";
import { Redis } from "ioredis";

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export enum EmailPriority {
    LOW = 1,
    NORMAL = 5,
    HIGH = 10,
}

export interface QueueEmailOptions extends EmailOptions {
    priority?: EmailPriority;
    delay?: number; // Delay in milliseconds
    scheduledFor?: Date; // Schedule for specific time
}

// Initialize Redis connection
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let emailQueue: Queue | null = null;

// Lazy initialization to avoid connection issues during build
function getEmailQueue(): Queue {
    if (!emailQueue) {
        const connection = new Redis(REDIS_URL, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
        });

        emailQueue = new Queue("emails", {
            connection,
            defaultJobOptions: {
                attempts: 3, // Retry up to 3 times
                backoff: {
                    type: "exponential",
                    delay: 2000, // Start with 2 seconds, then 4s, 8s
                },
                removeOnComplete: {
                    age: 24 * 3600, // Keep completed jobs for 24 hours
                    count: 1000, // Keep max 1000 completed jobs
                },
                removeOnFail: {
                    age: 7 * 24 * 3600, // Keep failed jobs for 7 days
                },
            },
        });

        console.log("[Email Queue] Queue initialized:", REDIS_URL);
    }

    return emailQueue;
}

/**
 * Add email to queue
 * @param options Email options with priority and scheduling
 * @returns Job ID
 */
export async function queueEmail(options: QueueEmailOptions): Promise<string> {
    const queue = getEmailQueue();

    const { priority = EmailPriority.NORMAL, delay, scheduledFor, ...emailData } = options;

    // Calculate delay if scheduledFor is provided
    let jobDelay = delay;
    if (scheduledFor && !delay) {
        jobDelay = Math.max(0, scheduledFor.getTime() - Date.now());
    }

    try {
        const job = await queue.add("send-email", emailData, {
            priority,
            delay: jobDelay,
        });

        console.log("[Email Queue] Email queued:", {
            jobId: job.id,
            to: emailData.to,
            subject: emailData.subject,
            priority,
            delay: jobDelay,
        });

        return job.id!;
    } catch (error: any) {
        console.error("[Email Queue] Failed to queue email:", {
            error: error.message,
            to: emailData.to,
            subject: emailData.subject,
        });
        throw error;
    }
}

/**
 * Queue welcome email (normal priority)
 */
export async function queueWelcomeEmail(to: string, html: string) {
    return queueEmail({
        to,
        subject: "Selamat Datang di Roxas Store! 🎮",
        html,
        priority: EmailPriority.NORMAL,
    });
}

/**
 * Queue verification email (high priority)
 */
export async function queueVerificationEmail(to: string, html: string) {
    return queueEmail({
        to,
        subject: "Verifikasi Email Anda - Roxas Store",
        html,
        priority: EmailPriority.HIGH,
    });
}

/**
 * Queue password reset email (high priority)
 */
export async function queuePasswordResetEmail(to: string, html: string) {
    return queueEmail({
        to,
        subject: "Reset Password - Roxas Store",
        html,
        priority: EmailPriority.HIGH,
    });
}

/**
 * Queue order confirmation email (normal priority)
 */
export async function queueOrderConfirmationEmail(to: string, html: string) {
    return queueEmail({
        to,
        subject: "Konfirmasi Pesanan - Roxas Store",
        html,
        priority: EmailPriority.NORMAL,
    });
}

/**
 * Get queue stats for monitoring
 */
export async function getEmailQueueStats() {
    const queue = getEmailQueue();

    const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
    ]);

    return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + delayed,
    };
}

/**
 * Clean up old jobs (for maintenance)
 */
export async function cleanupEmailQueue() {
    const queue = getEmailQueue();

    // Clean completed jobs older than 24 hours
    await queue.clean(24 * 3600 * 1000, 1000, "completed");

    // Clean failed jobs older than 7 days
    await queue.clean(7 * 24 * 3600 * 1000, 1000, "failed");

    console.log("[Email Queue] Cleanup completed");
}
