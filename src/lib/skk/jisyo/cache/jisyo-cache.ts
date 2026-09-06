import * as vscode from 'vscode';
import { CacheMetadata } from '../types';

/**
 * Gzip 圧縮を行います。
 */
export async function compressGzip(data: Uint8Array): Promise<Uint8Array> {
    const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'));
    const response = new Response(stream);
    return new Uint8Array(await response.arrayBuffer());
}

/**
 * Gzip 伸長を行います。
 */
export async function decompressGzip(data: Uint8Array): Promise<Uint8Array> {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'));
    const response = new Response(stream);
    return new Uint8Array(await response.arrayBuffer());
}

/**
 * Brotli 伸長を行います（Node.js 環境での後方互換用）。
 */
export async function decompressBrotli(data: Uint8Array): Promise<Uint8Array | null> {
    if (typeof process !== 'undefined' && process.versions?.node) {
        try {
            const zlibModuleName = 'zlib';
            const zlib = await import(zlibModuleName);
            const utilModuleName = 'util';
            const util = await import(utilModuleName);
            const decompress = util.promisify(zlib.brotliDecompress);
            const result = await decompress(data);
            return new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * 文字列を Base64URL 形式にエンコードします。
 */
export function toBase64Url(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    const len = bytes.length;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64URL 形式の文字列をデコードします。
 */
export function fromBase64Url(b64url: string): string {
    let base64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
        base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
}

export class JisyoCache {
    private static readonly cacheDirectory = ["cache", "jisyo"];
    private static readonly cacheExpiryDays = 30;

    private readonly cacheUri: vscode.Uri;

    constructor(storageUri: vscode.Uri) {
        this.cacheUri = vscode.Uri.joinPath(storageUri, ...JisyoCache.cacheDirectory);
    }

    /**
     * キャッシュディレクトリ構造を初期化します。
     */
    async init(): Promise<void> {
        try {
            await vscode.workspace.fs.createDirectory(this.cacheUri);
        } catch (e) {
            // ディレクトリ作成時のエラーは無視します
        }
    }

    /**
     * 不要になったキャッシュファイルを削除します。
     */
    async cleanUnusedCache(activeUrls: string[]): Promise<void> {
        const fs = vscode.workspace.fs;
        const cacheFiles = await fs.readDirectory(this.cacheUri);
        for (const [file, type] of cacheFiles) {
            if (type === vscode.FileType.File) {
                const cacheFileName = file.split(/[/\\]/).pop() || file;
                const acceptableSuffixes = [".dict.gz", ".dict.br", ".meta.json"];
                
                // ファイル名が *.dict.gz, *.dict.br, *.meta.json に一致しない場合は削除します
                const matchedSuffix = acceptableSuffixes.find(ext => cacheFileName.endsWith(ext));
                if (!matchedSuffix) {
                    await fs.delete(vscode.Uri.joinPath(this.cacheUri, file));
                    continue;
                }

                const cacheKey = cacheFileName.slice(0, -matchedSuffix.length);
                let url: string;
                try {
                    url = fromBase64Url(cacheKey);
                } catch {
                    await fs.delete(vscode.Uri.joinPath(this.cacheUri, file));
                    continue;
                }
                
                if (!activeUrls.includes(url)) {
                    await fs.delete(vscode.Uri.joinPath(this.cacheUri, file));
                }
            }
        }
    }

    /**
     * キャッシュから辞書データを読み込みます。
     */
    async tryReadFromCache(url: string): Promise<Uint8Array | null> {
        const fs = vscode.workspace.fs;
        const cacheFileName = toBase64Url(url);
        const gzCachePath = vscode.Uri.joinPath(this.cacheUri, `${cacheFileName}.dict.gz`);
        const brCachePath = vscode.Uri.joinPath(this.cacheUri, `${cacheFileName}.dict.br`);
        const metadataPath = vscode.Uri.joinPath(this.cacheUri, `${cacheFileName}.meta.json`);

        try {
            // メタデータの読み込みを試みます
            const metadataBytes = await fs.readFile(metadataPath);
            const metadata: CacheMetadata = JSON.parse(new TextDecoder().decode(metadataBytes));

            // キャッシュが有効期限内か確認します
            if (metadata.expiry > Date.now()) {
                // まず .dict.gz キャッシュの読み込みと伸長を試みます
                try {
                    const compressedData = await fs.readFile(gzCachePath);
                    return await decompressGzip(compressedData);
                } catch {
                    // .dict.gz が存在しない場合は後方互換性のため .dict.br を試みます
                    try {
                        const compressedData = await fs.readFile(brCachePath);
                        const decompressed = await decompressBrotli(compressedData);
                        if (decompressed) {
                            return decompressed;
                        }
                    } catch {
                        // Brotli 伸長に失敗した場合は無視します
                    }
                }
            }

            // 期限切れまたは破損したキャッシュファイルを削除します
            try {
                await fs.delete(gzCachePath);
            } catch {
                // ファイルが存在しない場合は無視します
            }
            try {
                await fs.delete(brCachePath);
            } catch {
                // ファイルが存在しない場合は無視します
            }
            try {
                await fs.delete(metadataPath);
            } catch {
                // ファイルが存在しない場合は無視します
            }
        } catch (e) {
            // ファイルが存在しない、無効なフォーマットなどのエラーが発生した場合は null を返します
        }
        return null;
    }

    /**
     * 辞書データをキャッシュに保存します。
     */
    async saveToCache(url: string, data: Uint8Array): Promise<void> {
        const fs = vscode.workspace.fs;
        const cacheFileName = toBase64Url(url);
        const cachePath = vscode.Uri.joinPath(this.cacheUri, `${cacheFileName}.dict.gz`);
        const metadataPath = vscode.Uri.joinPath(this.cacheUri, `${cacheFileName}.meta.json`);

        const compressedData = await compressGzip(data);
        const metadata: CacheMetadata = {
            expiry: Date.now() + JisyoCache.cacheExpiryDays * (1000 * 60 * 60 * 24) // ミリ秒単位
        };

        // ファイルを非同期で書き込みます
        await Promise.all([
            fs.writeFile(cachePath, compressedData),
            fs.writeFile(metadataPath, new TextEncoder().encode(JSON.stringify(metadata)))
        ]);
    }
}