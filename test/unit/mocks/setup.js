/**
 * 単体テスト環境（Node.js環境）における vscode モジュールのモック設定です。
 * JisyoCache 等で必要とされる Uri および FileType、workspace.fs を提供します。
 */
const Module = require('module');
const { URI, Utils } = require('vscode-uri');

const mockVscode = {
    Uri: {
        file: URI.file,
        parse: URI.parse,
        joinPath: Utils.joinPath,
    },
    FileType: {
        Unknown: 0,
        File: 1,
        Directory: 2,
        SymbolicLink: 64,
    },
    workspace: {
        fs: {}
    }
};

const origResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
    if (request === 'vscode') {
        return 'vscode';
    }
    return origResolveFilename.apply(this, arguments);
};

require.cache['vscode'] = {
    id: 'vscode',
    filename: 'vscode',
    loaded: true,
    exports: mockVscode
};
