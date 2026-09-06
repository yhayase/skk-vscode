//@ts-check
'use strict';

const path = require('path');
const webpack = require('webpack');

/** @typedef {import('webpack').Configuration} WebpackConfig **/

/**
 * Webpackの設定を生成します。
 * Web Extension環境（webworker）向けに拡張機能本体とテストスイートをバンドルします。
 *
 * @param {Record<string, any>} [env]
 * @param {Record<string, any>} [argv]
 * @returns {WebpackConfig[]}
 */
module.exports = (env, argv) => {
	const isProduction = (argv && argv.mode === 'production') || process.env.NODE_ENV === 'production';

	/** @type WebpackConfig */
	const webExtensionConfig = {
		mode: isProduction ? 'production' : 'none',
		target: 'webworker',
		entry: {
			extension: './src/extension.ts',
			'test/suite/index': './test/web/index.ts'
		},
		output: {
			filename: '[name].js',
			path: path.join(__dirname, './dist/web'),
			libraryTarget: 'commonjs',
			devtoolModuleFilenameTemplate: '../../[resource-path]'
		},
		resolve: {
			mainFields: ['browser', 'module', 'main'],
			extensions: ['.ts', '.js'],
			fallback: {
				assert: require.resolve('assert/')
			}
		},
		module: {
			rules: [
				{
					test: /\.ts$/,
					exclude: /node_modules/,
					use: [
						{
							loader: 'ts-loader',
							options: {
								configFile: 'tsconfig.json'
							}
						}
					]
				}
			]
		},
		plugins: [
			new webpack.ProvidePlugin({
				process: 'process/browser'
			})
		],
		externals: {
			vscode: 'commonjs vscode'
		},
		performance: {
			hints: false
		},
		devtool: 'nosources-source-map'
	};

	return [webExtensionConfig];
};