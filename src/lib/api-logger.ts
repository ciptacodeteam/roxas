import { db } from "@/server/db";
import { ApiProvider, ApiLogStatus, Prisma } from "@prisma/client";

// Re-export for convenience
export { ApiProvider, ApiLogStatus };

interface LogApiCallParams {
    provider: ApiProvider;
    endpoint: string;
    method?: string;
    requestData?: Record<string, unknown>;
    status: ApiLogStatus;
    statusCode?: number;
    responseData?: Record<string, unknown>;
    errorMessage?: string;
    responseTime?: number;
    orderId?: string;
    refId?: string;
}

/**
 * Sanitize request/response data to remove sensitive information
 */
function sanitizeData(data: Record<string, unknown> | undefined): Prisma.JsonValue | undefined {
    if (!data) return undefined;

    const sensitiveKeys = [
        "password",
        "api_key",
        "apiKey",
        "secret",
        "token",
        "authorization",
        "sign",
        "signature",
        "server_key",
        "serverKey",
        "client_key",
        "clientKey",
    ];

    const sanitized = { ...data };

    for (const key of Object.keys(sanitized)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some((sk) => lowerKey.includes(sk.toLowerCase()))) {
            sanitized[key] = "[REDACTED]";
        }
    }

    return sanitized as Prisma.JsonValue;
}

/**
 * Log an API call to the database
 */
export async function logApiCall(params: LogApiCallParams): Promise<void> {
    try {
        await db.apiLog.create({
            data: {
                provider: params.provider,
                endpoint: params.endpoint,
                method: params.method || "POST",
                requestData: sanitizeData(params.requestData) as any,
                status: params.status,
                statusCode: params.statusCode,
                responseData: sanitizeData(params.responseData) as any,
                errorMessage: params.errorMessage?.slice(0, 1000), // Limit error message length
                responseTime: params.responseTime,
                orderId: params.orderId,
                refId: params.refId,
            },
        });
    } catch (error) {
        // Don't throw - logging should not break the main flow
        console.error("Failed to log API call:", error);
    }
}

/**
 * Wrapper to execute and log API calls with timing
 */
export async function executeAndLogApiCall<T>(params: {
    provider: ApiProvider;
    endpoint: string;
    method?: string;
    requestData?: Record<string, unknown>;
    orderId?: string;
    refId?: string;
    execute: () => Promise<T>;
}): Promise<T> {
    const startTime = Date.now();

    try {
        const result = await params.execute();
        const responseTime = Date.now() - startTime;

        // Log success
        await logApiCall({
            provider: params.provider,
            endpoint: params.endpoint,
            method: params.method,
            requestData: params.requestData,
            status: ApiLogStatus.SUCCESS,
            statusCode: 200,
            responseData: result as Record<string, unknown>,
            responseTime,
            orderId: params.orderId,
            refId: params.refId,
        });

        return result;
    } catch (error) {
        const responseTime = Date.now() - startTime;
        const isTimeout = error instanceof Error && error.message.includes("timeout");

        // Log failure
        await logApiCall({
            provider: params.provider,
            endpoint: params.endpoint,
            method: params.method,
            requestData: params.requestData,
            status: isTimeout ? ApiLogStatus.TIMEOUT : ApiLogStatus.ERROR,
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            responseTime,
            orderId: params.orderId,
            refId: params.refId,
        });

        throw error;
    }
}

/**
 * Get API health status summary
 */
export async function getApiHealthStatus() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    // Get stats for all providers
    const [digiflazzStats, midtransStats, mailgunStats, recentLogs] = await Promise.all([
        db.apiLog.groupBy({
            by: ["status"],
            where: {
                provider: ApiProvider.DIGIFLAZZ,
                createdAt: { gte: last24Hours },
            },
            _count: { id: true },
            _avg: { responseTime: true },
        }),
        db.apiLog.groupBy({
            by: ["status"],
            where: {
                provider: ApiProvider.MIDTRANS,
                createdAt: { gte: last24Hours },
            },
            _count: { id: true },
            _avg: { responseTime: true },
        }),
        db.apiLog.groupBy({
            by: ["status"],
            where: {
                provider: ApiProvider.MAILGUN,
                createdAt: { gte: last24Hours },
            },
            _count: { id: true },
            _avg: { responseTime: true },
        }),
        db.apiLog.findMany({
            where: {
                createdAt: { gte: lastHour },
                status: { in: [ApiLogStatus.FAILED, ApiLogStatus.TIMEOUT, ApiLogStatus.ERROR] },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
        }),
    ]);

    const calculateHealth = (stats: typeof digiflazzStats) => {
        const total = stats.reduce((sum, s) => sum + s._count.id, 0);
        const successful = stats.find((s) => s.status === ApiLogStatus.SUCCESS)?._count.id || 0;
        const failed = total - successful;
        const avgResponseTime = stats.find((s) => s.status === ApiLogStatus.SUCCESS)?._avg.responseTime || 0;

        return {
            total,
            successful,
            failed,
            successRate: total > 0 ? Math.round((successful / total) * 100) : 100,
            avgResponseTime: Math.round(avgResponseTime),
            status: total === 0 ? "unknown" : failed === 0 ? "healthy" : failed / total > 0.1 ? "degraded" : "healthy",
        };
    };

    return {
        digiflazz: calculateHealth(digiflazzStats),
        midtrans: calculateHealth(midtransStats),
        mailgun: calculateHealth(mailgunStats),
        recentErrors: recentLogs,
        timestamp: now.toISOString(),
    };
}
