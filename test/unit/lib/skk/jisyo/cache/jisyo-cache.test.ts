import { expect } from 'chai';
import * as vscode from 'vscode';
import * as zlib from 'zlib';
import {
    JisyoCache,
    toBase64Url,
    fromBase64Url,
    compressGzip,
    decompressGzip
} from '../../../../../../src/lib/skk/jisyo/cache/jisyo-cache';

/**
 * テスト用のインメモリ FileSystem 実装です。
 */
class InMemoryFileSystem {
    private files = new Map<string, Uint8Array>();
    private directories = new Set<string>();

    private normalize(uri: vscode.Uri): string {
        return (uri.path || uri.fsPath).replace(/\/+/g, '/').replace(/\/$/, '');
    }

    async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
        const norm = this.normalize(uri);
        if (this.files.has(norm)) {
            return {
                type: vscode.FileType.File,
                ctime: 0,
                mtime: 0,
                size: this.files.get(norm)!.length
            };
        }
        if (this.directories.has(norm)) {
            return {
                type: vscode.FileType.Directory,
                ctime: 0,
                mtime: 0,
                size: 0
            };
        }
        throw new Error(`File not found: ${norm}`);
    }

    async createDirectory(uri: vscode.Uri): Promise<void> {
        const norm = this.normalize(uri);
        this.directories.add(norm);
    }

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        const norm = this.normalize(uri);
        const data = this.files.get(norm);
        if (!data) {
            throw new Error(`File not found: ${norm}`);
        }
        return data;
    }

    async writeFile(uri: vscode.Uri, content: Uint8Array): Promise<void> {
        const norm = this.normalize(uri);
        this.files.set(norm, content);
    }

    async delete(uri: vscode.Uri): Promise<void> {
        const norm = this.normalize(uri);
        if (!this.files.has(norm) && !this.directories.has(norm)) {
            throw new Error(`File not found: ${norm}`);
        }
        this.files.delete(norm);
        this.directories.delete(norm);
    }

    async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        const norm = this.normalize(uri);
        const results: [string, vscode.FileType][] = [];

        for (const filePath of this.files.keys()) {
            const lastSlash = filePath.lastIndexOf('/');
            const parent = filePath.slice(0, lastSlash);
            const name = filePath.slice(lastSlash + 1);
            if (parent === norm) {
                results.push([name, vscode.FileType.File]);
            }
        }

        for (const dirPath of this.directories) {
            const lastSlash = dirPath.lastIndexOf('/');
            const parent = dirPath.slice(0, lastSlash);
            const name = dirPath.slice(lastSlash + 1);
            if (parent === norm) {
                results.push([name, vscode.FileType.Directory]);
            }
        }

        return results;
    }

    hasFile(uri: vscode.Uri): boolean {
        return this.files.has(this.normalize(uri));
    }

    hasDirectory(uri: vscode.Uri): boolean {
        return this.directories.has(this.normalize(uri));
    }
}

describe('JisyoCache', () => {
    let mockFs: InMemoryFileSystem;
    let storageUri: vscode.Uri;
    let cache: JisyoCache;

    beforeEach(async () => {
        mockFs = new InMemoryFileSystem();
        (vscode.workspace as any).fs = mockFs;
        storageUri = vscode.Uri.file('/mock/storage');
        cache = new JisyoCache(storageUri);
        await cache.init();
    });

    describe('toBase64Url & fromBase64Url', () => {
        it('URLを正しく Base64URL に変換および復元できること', () => {
            const urls = [
                'https://example.com/SKK-JISYO.L',
                'https://raw.githubusercontent.com/skk-dev/dict/master/SKK-JISYO.L',
                'https://example.org/辞書?q=日本語#テスト'
            ];

            for (const url of urls) {
                const encoded = toBase64Url(url);
                expect(encoded).to.not.include('+');
                expect(encoded).to.not.include('/');
                expect(encoded).to.not.include('=');
                const decoded = fromBase64Url(encoded);
                expect(decoded).to.equal(url);
            }
        });
    });

    describe('compressGzip & decompressGzip', () => {
        it('データを正しく圧縮および伸長できること', async () => {
            const originalText = 'SKK辞書テストデータ\nあい /愛/藍/\n';
            const originalBytes = new TextEncoder().encode(originalText);
            const compressed = await compressGzip(originalBytes);
            const decompressed = await decompressGzip(compressed);
            const decodedText = new TextDecoder().decode(decompressed);
            expect(decodedText).to.equal(originalText);
        });
    });

    describe('saveToCache & tryReadFromCache', () => {
        const testUrl = 'https://example.com/test-dict';
        const testData = new TextEncoder().encode('test /テスト/\n');

        it('データを .dict.gz 形式で正常に保存し、キャッシュから読み込めること', async () => {
            await cache.saveToCache(testUrl, testData);

            const readData = await cache.tryReadFromCache(testUrl);
            expect(readData).to.not.be.null;
            expect(new TextDecoder().decode(readData!)).to.equal('test /テスト/\n');

            // .dict.gz ファイルが実際に作成されていることを確認します
            const cacheKey = toBase64Url(testUrl);
            const gzUri = vscode.Uri.joinPath(storageUri, 'cache', 'jisyo', `${cacheKey}.dict.gz`);
            const metaUri = vscode.Uri.joinPath(storageUri, 'cache', 'jisyo', `${cacheKey}.meta.json`);
            expect(mockFs.hasFile(gzUri)).to.be.true;
            expect(mockFs.hasFile(metaUri)).to.be.true;
        });

        it('存在しない URL の場合は null を返すこと', async () => {
            const result = await cache.tryReadFromCache('https://example.com/non-existent');
            expect(result).to.be.null;
        });

        it('有効期限切れのキャッシュの場合は null を返し、キャッシュファイルを削除すること', async () => {
            await cache.saveToCache(testUrl, testData);

            const cacheKey = toBase64Url(testUrl);
            const metaUri = vscode.Uri.joinPath(storageUri, 'cache', 'jisyo', `${cacheKey}.meta.json`);
            const gzUri = vscode.Uri.joinPath(storageUri, 'cache', 'jisyo', `${cacheKey}.dict.gz`);

            // 過去の有効期限をメタデータに書き込みます
            const expiredMeta = { expiry: Date.now() - 10000 };
            await mockFs.writeFile(metaUri, new TextEncoder().encode(JSON.stringify(expiredMeta)));

            const result = await cache.tryReadFromCache(testUrl);
            expect(result).to.be.null;

            // 期限切れファイルが削除されたことを確認します
            expect(mockFs.hasFile(gzUri)).to.be.false;
            expect(mockFs.hasFile(metaUri)).to.be.false;
        });

        it('後方互換性: .dict.br ファイルを正常に読み込めること', async () => {
            const cacheKey = toBase64Url(testUrl);
            const brUri = vscode.Uri.joinPath(storageUri, 'cache', 'jisyo', `${cacheKey}.dict.br`);
            const metaUri = vscode.Uri.joinPath(storageUri, 'cache', 'jisyo', `${cacheKey}.meta.json`);

            const compressedBr = zlib.brotliCompressSync(testData);
            const validMeta = { expiry: Date.now() + 100000 };

            await mockFs.writeFile(brUri, new Uint8Array(compressedBr));
            await mockFs.writeFile(metaUri, new TextEncoder().encode(JSON.stringify(validMeta)));

            const result = await cache.tryReadFromCache(testUrl);
            expect(result).to.not.be.null;
            expect(new TextDecoder().decode(result!)).to.equal('test /テスト/\n');
        });

        it('破損したキャッシュデータの場合は null を返すこと', async () => {
            const cacheKey = toBase64Url(testUrl);
            const gzUri = vscode.Uri.joinPath(storageUri, 'cache', 'jisyo', `${cacheKey}.dict.gz`);
            const metaUri = vscode.Uri.joinPath(storageUri, 'cache', 'jisyo', `${cacheKey}.meta.json`);

            // 不正な圧縮データを書き込みます
            await mockFs.writeFile(gzUri, new Uint8Array([1, 2, 3, 4, 5]));
            await mockFs.writeFile(metaUri, new TextEncoder().encode(JSON.stringify({ expiry: Date.now() + 10000 })));

            const result = await cache.tryReadFromCache(testUrl);
            expect(result).to.be.null;
        });
    });

    describe('cleanUnusedCache', () => {
        it('アクティブでないURLや無効なキャッシュファイルを削除し、アクティブなファイルを保持すること', async () => {
            const activeUrl1 = 'https://example.com/dict1';
            const activeUrl2 = 'https://example.com/dict2';
            const inactiveUrl1 = 'https://example.com/dict3';
            const dummyData = new TextEncoder().encode('dummy');

            // activeUrl1 (.dict.gz) を保存
            await cache.saveToCache(activeUrl1, dummyData);

            // activeUrl2 (.dict.br) を手動配置（後方互換テスト）
            const key2 = toBase64Url(activeUrl2);
            const brUri2 = vscode.Uri.joinPath(storageUri, 'cache', 'jisyo', `${key2}.dict.br`);
            const metaUri2 = vscode.Uri.joinPath(storageUri, 'cache', 'jisyo', `${key2}.meta.json`);
            await mockFs.writeFile(brUri2, zlib.brotliCompressSync(dummyData));
            await mockFs.writeFile(metaUri2, new TextEncoder().encode(JSON.stringify({ expiry: Date.now() + 10000 })));

            // inactiveUrl1 (.dict.gz) を保存
            await cache.saveToCache(inactiveUrl1, dummyData);

            // 無関係な拡張子のファイルを配置
            const unknownFileUri = vscode.Uri.joinPath(storageUri, 'cache', 'jisyo', 'garbage.txt');
            await mockFs.writeFile(unknownFileUri, new TextEncoder().encode('garbage'));

            // クリーンアップ実行
            await cache.cleanUnusedCache([activeUrl1, activeUrl2]);

            // activeUrl1 のファイルが存在することを確認します
            const key1 = toBase64Url(activeUrl1);
            expect(mockFs.hasFile(vscode.Uri.joinPath(storageUri, 'cache', 'jisyo', `${key1}.dict.gz`))).to.be.true;
            expect(mockFs.hasFile(vscode.Uri.joinPath(storageUri, 'cache', 'jisyo', `${key1}.meta.json`))).to.be.true;

            // activeUrl2 のファイルが存在することを確認します
            expect(mockFs.hasFile(brUri2)).to.be.true;
            expect(mockFs.hasFile(metaUri2)).to.be.true;

            // inactiveUrl1 のファイルが削除されていることを確認します
            const key3 = toBase64Url(inactiveUrl1);
            expect(mockFs.hasFile(vscode.Uri.joinPath(storageUri, 'cache', 'jisyo', `${key3}.dict.gz`))).to.be.false;
            expect(mockFs.hasFile(vscode.Uri.joinPath(storageUri, 'cache', 'jisyo', `${key3}.meta.json`))).to.be.false;

            // 無関係なファイルが削除されていることを確認します
            expect(mockFs.hasFile(unknownFileUri)).to.be.false;
        });

        it('不正な Base64URL ファイル名が含まれていても安全に削除され継続すること', async () => {
            // Base64URL としてデコードできない不正な文字列を含むキャッシュファイルを配置
            const badFileUri = vscode.Uri.joinPath(storageUri, 'cache', 'jisyo', '%%%invalid%%%.dict.gz');
            await mockFs.writeFile(badFileUri, new TextEncoder().encode('dummy'));

            await cache.cleanUnusedCache([]);
            expect(mockFs.hasFile(badFileUri)).to.be.false;
        });
    });

    describe('init', () => {
        it('期待されるキャッシュディレクトリを正確に作成し、不要なネストされたサブディレクトリを作成しないこと', async () => {
            const freshFs = new InMemoryFileSystem();
            (vscode.workspace as any).fs = freshFs;
            const freshCache = new JisyoCache(storageUri);

            const expectedDir = vscode.Uri.joinPath(storageUri, 'cache', 'jisyo');
            const unwantedDir = vscode.Uri.joinPath(storageUri, 'cache', 'jisyo', 'cache');

            await freshCache.init();

            expect(freshFs.hasDirectory(expectedDir)).to.be.true;
            expect(freshFs.hasDirectory(unwantedDir)).to.be.false;

            // 冪等性の確認: 再度 init を呼び出しても正常に完了すること
            await freshCache.init();
            expect(freshFs.hasDirectory(expectedDir)).to.be.true;
            expect(freshFs.hasDirectory(unwantedDir)).to.be.false;
        });

        it('既にディレクトリが存在する場合でも正常に動作すること', async () => {
            // 再度 init を呼んでも例外が発生しないことを確認します
            await cache.init();
        });
    });

    describe('decompressBrotli', () => {
        it('Node.js 環境で Brotli 圧縮データを正常に伸長できること', async () => {
            const { decompressBrotli } = await import('../../../../../../src/lib/skk/jisyo/cache/jisyo-cache');
            const original = new TextEncoder().encode('brotli-test-data');
            const compressed = zlib.brotliCompressSync(original);
            const decompressed = await decompressBrotli(new Uint8Array(compressed));
            expect(decompressed).to.not.be.null;
            expect(new TextDecoder().decode(decompressed!)).to.equal('brotli-test-data');
        });
    });
});
