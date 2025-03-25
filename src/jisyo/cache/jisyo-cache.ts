import * as vscode from 'vscode';
import { brotliCompress, brotliDecompress } from 'zlib';
import { promisify } from 'util';
import { CacheMetadata } from '../types';
import * as path from 'path';

const compress = promisify(brotliCompress);
const decompress = promisify(brotliDecompress);

const fs = vscode.workspace.fs;

export class JisyoCache {
    private static readonly cacheDirectory = ["cache", "jisyo"];
    private static readonly cacheExpiryDays = 30;

    private readonly cacheUri: vscode.Uri;

    constructor(storageUri: vscode.Uri) {
        this.cacheUri = vscode.Uri.joinPath(storageUri, ...JisyoCache.cacheDirectory);
    }

    /**
     * Initialize the cache directory structure
     */
    async init(): Promise<void> {
        try {
            await fs.stat(this.cacheUri);
        } catch (e) {
            for (let i = 0; i <= JisyoCache.cacheDirectory.length; i++) {
                const slice = JisyoCache.cacheDirectory.slice(0, i);
                const dir = vscode.Uri.joinPath(this.cacheUri, ...slice);
                try {
                    await fs.createDirectory(dir);
                } catch (e) {
                    // Directory might already exist, that's fine
                }
            }
        }
    }

    /**
     * Clean up cache files that are no longer needed
     */
    async cleanUnusedCache(activeUrls: string[]): Promise<void> {
        const cacheFiles = await fs.readDirectory(this.cacheUri);
        for (const [file, type] of cacheFiles) {
            if (type === vscode.FileType.File) {
                const cacheFileName = path.basename(file);
                const acceptableSuffixes = [".dict.br", ".meta.json"];
                
                // remove file if file name does not match *.dict.br or *.meta.json
                if (!acceptableSuffixes.some(ext => cacheFileName.endsWith(ext))) {
                    await fs.delete(vscode.Uri.joinPath(this.cacheUri, file));
                    continue;
                }

                const cacheKey = acceptableSuffixes.reduce(
                    (key, ext) => key.replace(ext, ''), 
                    cacheFileName
                );
                const url = Buffer.from(cacheKey, 'base64url').toString();
                
                if (!activeUrls.includes(url)) {
                    await fs.delete(vscode.Uri.joinPath(this.cacheUri, file));
                }
            }
        }
    }

    /**
     * Try to read dictionary data from cache
     */
    async tryReadFromCache(url: string): Promise<Buffer | null> {
        const cacheFileName = Buffer.from(url).toString('base64url');
        const cachePath = vscode.Uri.joinPath(this.cacheUri, `${cacheFileName}.dict.br`);
        const metadataPath = vscode.Uri.joinPath(this.cacheUri, `${cacheFileName}.meta.json`);

        try {
            // Try to read metadata
            const metadataBytes = await fs.readFile(metadataPath);
            const metadata: CacheMetadata = JSON.parse(new TextDecoder().decode(metadataBytes));

            // Check if cache is still valid
            if (metadata.expiry > Date.now()) {
                // Read and decompress cached dictionary
                const compressedData = await fs.readFile(cachePath);
                return await decompress(compressedData);
            }

            // Delete expired cache files
            await fs.delete(cachePath);
            await fs.delete(metadataPath);
        } catch (e) {
            // If any error occurs (file not found, invalid format, etc.), return null
        }
        return null;
    }

    /**
     * Save dictionary data to cache
     */
    async saveToCache(url: string, data: Buffer): Promise<void> {
        const cacheFileName = Buffer.from(url).toString('base64url');
        const cachePath = vscode.Uri.joinPath(this.cacheUri, `${cacheFileName}.dict.br`);
        const metadataPath = vscode.Uri.joinPath(this.cacheUri, `${cacheFileName}.meta.json`);

        const compressedData = await compress(data);
        const metadata: CacheMetadata = {
            expiry: Date.now() + JisyoCache.cacheExpiryDays * (1000 * 60 * 60 * 24) // in milliseconds
        };

        // Write files asynchronously
        await Promise.all([
            fs.writeFile(cachePath, compressedData),
            fs.writeFile(metadataPath, Buffer.from(JSON.stringify(metadata)))
        ]);
    }
}