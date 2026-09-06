import 'mocha/mocha';

/**
 * Web環境におけるテストスイートのエントリポイントです。
 * Mochaのセットアップを行い、すべてのインテグレーションテストを実行します。
 */
export function run(): Promise<void> {
	return new Promise((resolve, reject) => {
		mocha.setup({
			ui: 'tdd',
			reporter: undefined,
			timeout: 20000
		});

		// インテグレーションテストスイート内のすべてのテストファイルを動的に読み込みます
		const importAll = (r: __WebpackModuleApi.RequireContext) => r.keys().forEach(r);
		importAll(require.context('../integration/suite', true, /\.test\.(ts|js)$/));

		try {
			// Mochaテストを実行します
			mocha.run(failures => {
				if (failures > 0) {
					reject(new Error(`${failures} tests failed.`));
				} else {
					resolve();
				}
			});
		} catch (err) {
			console.error(err);
			reject(err);
		}
	});
}
