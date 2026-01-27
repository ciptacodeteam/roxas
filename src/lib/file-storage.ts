import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

/**
 * Local File Storage Utility
 * Saves files to local disk instead of Vercel Blob
 * 
 * Development: Saves to /public/uploads
 * Production: Saves to /var/www/uploads (Docker volume)
 */

const isDevelopment = process.env.NODE_ENV === "development";

// Storage paths
const UPLOAD_DIR = isDevelopment
    ? path.join(process.cwd(), "public", "uploads")
    : "/var/www/uploads";

// Public URL path (how files are accessed via HTTP)
const PUBLIC_PATH = "/uploads";

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir(subDir?: string) {
    const fullPath = subDir ? path.join(UPLOAD_DIR, subDir) : UPLOAD_DIR;

    try {
        await fs.access(fullPath);
    } catch {
        await fs.mkdir(fullPath, { recursive: true });
    }

    return fullPath;
}

/**
 * Upload file to local storage
 */
export async function uploadFile(
    buffer: Buffer,
    filename: string,
    options?: {
        subDir?: string; // Subdirectory (e.g., "products", "banners")
        contentType?: string;
    }
) {
    const subDir = options?.subDir || "general";

    // Ensure directory exists
    const uploadPath = await ensureUploadDir(subDir);

    // Generate unique filename to avoid collisions
    const uniqueFilename = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${filename}`;
    const filePath = path.join(uploadPath, uniqueFilename);

    // Write file to disk
    await fs.writeFile(filePath, buffer);

    // Return public URL
    const url = `${PUBLIC_PATH}/${subDir}/${uniqueFilename}`;

    return {
        url,
        pathname: url,
        size: buffer.length,
        uploadedAt: new Date(),
    };
}

/**
 * Delete file from local storage
 */
export async function deleteFile(url: string) {
    try {
        // Extract path from URL
        const urlPath = url.replace(PUBLIC_PATH, "");
        const filePath = path.join(UPLOAD_DIR, urlPath);

        // Delete file
        await fs.unlink(filePath);

        return { success: true };
    } catch (error) {
        console.error("Error deleting file:", error);
        return { success: false, error };
    }
}

/**
 * Get file info
 */
export async function getFileInfo(url: string) {
    try {
        const urlPath = url.replace(PUBLIC_PATH, "");
        const filePath = path.join(UPLOAD_DIR, urlPath);

        const stats = await fs.stat(filePath);

        return {
            exists: true,
            size: stats.size,
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime,
        };
    } catch {
        return {
            exists: false,
        };
    }
}

/**
 * List files in a directory
 */
export async function listFiles(subDir?: string) {
    const uploadPath = await ensureUploadDir(subDir);

    try {
        const files = await fs.readdir(uploadPath);

        const fileInfos = await Promise.all(
            files.map(async (filename) => {
                const filePath = path.join(uploadPath, filename);
                const stats = await fs.stat(filePath);
                const url = `${PUBLIC_PATH}/${subDir ? subDir + "/" : ""}${filename}`;

                return {
                    filename,
                    url,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime,
                };
            })
        );

        return fileInfos;
    } catch (error) {
        console.error("Error listing files:", error);
        return [];
    }
}
