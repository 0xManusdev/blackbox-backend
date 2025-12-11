"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStorageConfigured = isStorageConfigured;
exports.uploadFile = uploadFile;
exports.uploadFiles = uploadFiles;
exports.deleteFile = deleteFile;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../config");
const ErrorHandler_1 = require("../utils/ErrorHandler");
let supabase = null;
// Initialize Supabase client
function getSupabaseClient() {
    if (!config_1.config.supabaseUrl || !config_1.config.supabaseServiceKey) {
        throw new ErrorHandler_1.AppError('Supabase not configured', 500);
    }
    if (!supabase) {
        supabase = (0, supabase_js_1.createClient)(config_1.config.supabaseUrl, config_1.config.supabaseServiceKey);
    }
    return supabase;
}
// Check if Supabase is configured
function isStorageConfigured() {
    return !!(config_1.config.supabaseUrl && config_1.config.supabaseServiceKey);
}
// Upload a file to Supabase Storage
async function uploadFile(file, reportId) {
    const client = getSupabaseClient();
    // Generate unique filename
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = reportId
        ? `reports/${reportId}/${timestamp}_${safeName}`
        : `temp/${timestamp}_${safeName}`;
    const { data, error } = await client.storage
        .from(config_1.config.supabaseBucket)
        .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
    });
    if (error) {
        console.error('Supabase upload error:', error);
        throw new ErrorHandler_1.AppError('Failed to upload file', 500);
    }
    // Get public URL
    const { data: urlData } = client.storage
        .from(config_1.config.supabaseBucket)
        .getPublicUrl(data.path);
    return urlData.publicUrl;
}
// Upload multiple files
async function uploadFiles(files, reportId) {
    if (!isStorageConfigured()) {
        console.warn('Storage not configured, skipping file uploads');
        return [];
    }
    const urls = [];
    for (const file of files) {
        const url = await uploadFile(file, reportId);
        urls.push(url);
    }
    return urls;
}
// Delete a file from Supabase Storage
async function deleteFile(fileUrl) {
    const client = getSupabaseClient();
    // Extract path from URL
    const urlParts = fileUrl.split(`${config_1.config.supabaseBucket}/`);
    if (urlParts.length < 2)
        return;
    const path = urlParts[1];
    const { error } = await client.storage
        .from(config_1.config.supabaseBucket)
        .remove([path]);
    if (error) {
        console.error('Supabase delete error:', error);
    }
}
//# sourceMappingURL=StorageService.js.map