import * as vscode from 'vscode';
import { JisyoLoader } from './loader/jisyo-loader';
import { CompositeJisyo } from './composite-jisyo';

let globalJisyo: CompositeJisyo;

export async function init(memento: vscode.Memento, storageUri: vscode.Uri): Promise<void> {
    const cfg = vscode.workspace.getConfiguration("skk");
    const dictUrls = cfg.get<string[]>("dictUrls", [
        "https://raw.githubusercontent.com/skk-dev/dict/master/SKK-JISYO.L"
    ]);

    const loader = new JisyoLoader(storageUri);
    await loader.init();

    const systemJisyos = await loader.loadSystemJisyos(dictUrls);
    const userJisyo = loader.loadUserJisyo(memento);

    globalJisyo = new CompositeJisyo([userJisyo, ...systemJisyos], memento);
    cleanUpOldMementoKeys(memento);
}

/**
 * Remove old memento keys such like skk.jisyoCache and skk.jisyoCacheExpiries
 */
async function cleanUpOldMementoKeys(memento: vscode.Memento) {
    const activeMementoKeys = ["skk.user-jisyo"];
    memento.keys()
        .filter((key) => !activeMementoKeys.includes(key))
        .forEach((key) => {
            memento.update(key, undefined);
        });
}

export function getGlobalJisyo(): CompositeJisyo {
    return globalJisyo;
}

export function deactivate() {
    return globalJisyo.saveUserJisyo();
}
