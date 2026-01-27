/**
 * Email Worker - Processes email jobs from Redis queue
 * Handles retries, failures, and logging
 */

import { Worker, Job } from "bullmq";
import { Redis } from "ioredis";
import { sendEmail, type EmailOptions } from "../src/lib/mailgun";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const WORKER_CONCURRENCY = parseInt(process.env.EMAIL_WORKER_CONCURRENCY || "5");

// Initialize Redis connection
const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
});

console.log("[Email Worker] Starting email worker...");
console.log("[Email Worker] Redis URL:", REDIS_URL);
console.log("[Email Worker] Concurrency:", WORKER_CONCURRENCY);

// Create the email worker
const emailWorker = new Worker<EmailOptions>(
    "emails",
    async (job: Job<EmailOptions>) => {
        const { to, subject, html, text } = job.data;

        console.log(`[Email Worker] Processing job ${job.id}:`, {
            to,
            subject,
            attempt: job.attemptsMade + 1,
            priority: job.opts.priority,
        });

        try {
            // Send the email using Mailgun
            const result = await sendEmail({ to, subject, html, text });

            console.log(`[Email Worker] Job ${job.id} completed successfully:`, {
                messageId: result.messageId,
                to,
            });

            return result;
        } catch (error: any) {
            console.error(`[Email Worker] Job ${job.id} failed:`, {
                error: error.message,
                to,
                attempt: job.attemptsMade + 1,
                stack: error.stack,
            });

            // Re-throw error to trigger retry mechanism
            throw error;
        }
    },
    {
        connection,
        concurrency: WORKER_CONCURRENCY,
        limiter: {
            max: 100, // Max 100 emails
            duration: 60000, // Per 60 seconds (respects Mailgun rate limits)
        },
    }
);

// Event handlers for monitoring
emailWorker.on("completed", (job) => {
    console.log(`[Email Worker] ✅ Job ${job.id} completed successfully`);
});

emailWorker.on("failed", (job, err) => {
    console.error(`[Email Worker] ❌ Job ${job?.id} failed:`, {
        error: err.message,
        attempts: job?.attemptsMade,
        data: job?.data,
    });
});

emailWorker.on("error", (err) => {
    console.error("[Email Worker] Worker error:", err);
});

emailWorker.on("stalled", (jobId) => {
    console.warn(`[Email Worker] ⚠️ Job ${jobId} stalled`);
});

// Graceful shutdown
const shutdown = async () => {
    console.log("[Email Worker] Shutting down gracefully...");
    await emailWorker.close();
    await connection.quit();
    process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log("[Email Worker] Worker is running and waiting for jobs...");
