export declare function isStorageConfigured(): boolean;
export declare function uploadFile(file: Express.Multer.File, reportId?: number): Promise<string>;
export declare function uploadFiles(files: Express.Multer.File[], reportId?: number): Promise<string[]>;
export declare function deleteFile(fileUrl: string): Promise<void>;
