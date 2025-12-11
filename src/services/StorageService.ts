import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { AppError } from '../utils/ErrorHandler';

let supabase: SupabaseClient | null = null;

// Initialize Supabase client
function getSupabaseClient(): SupabaseClient {
    if (!config.supabaseUrl || !config.supabaseServiceKey) {
        throw new AppError('Supabase not configured', 500);
    }

    if (!supabase) {
        supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    }

    return supabase;
}

// Check if Supabase is configured
export function isStorageConfigured(): boolean {
    return !!(config.supabaseUrl && config.supabaseServiceKey);
}

// Upload a file to Supabase Storage
export async function uploadFile(
    file: Express.Multer.File,
    reportId?: number
): Promise<string> {
    const client = getSupabaseClient();

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = reportId 
        ? `reports/${reportId}/${timestamp}_${safeName}`
        : `temp/${timestamp}_${safeName}`;

    const { data, error } = await client.storage
        .from(config.supabaseBucket)
        .upload(path, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
        });

    if (error) {
        console.error('Supabase upload error:', error);
        throw new AppError('Failed to upload file', 500);
    }

    // Get public URL
    const { data: urlData } = client.storage
        .from(config.supabaseBucket)
        .getPublicUrl(data.path);

    return urlData.publicUrl;
}

// Upload multiple files
export async function uploadFiles(
    files: Express.Multer.File[],
    reportId?: number
): Promise<string[]> {
    if (!isStorageConfigured()) {
        console.warn('Storage not configured, skipping file uploads');
        return [];
    }

    const urls: string[] = [];

    for (const file of files) {
        const url = await uploadFile(file, reportId);
        urls.push(url);
    }

    return urls;
}

// Delete a file from Supabase Storage
export async function deleteFile(fileUrl: string): Promise<void> {
    const client = getSupabaseClient();

    // Extract path from URL
    const urlParts = fileUrl.split(`${config.supabaseBucket}/`);
    if (urlParts.length < 2) return;

    const path = urlParts[1];

    const { error } = await client.storage
        .from(config.supabaseBucket)
        .remove([path]);

    if (error) {
        console.error('Supabase delete error:', error);
    }
}
