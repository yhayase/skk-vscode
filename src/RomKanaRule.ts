export interface RomKanaRule {
    remain: string;
    hiragana: string;
    katakana?: string;
}

/* eslint-disable @typescript-eslint/naming-convention */
export let romKanaBaseRule: { [key: string]: RomKanaRule; } = {
    "a": { "remain": "", "katakana": "ア", "hiragana": "あ" },
    "bb": { "remain": "b", "katakana": "ッ", "hiragana": "っ" },
    "ba": { "remain": "", "katakana": "バ", "hiragana": "ば" },
    "be": { "remain": "", "katakana": "ベ", "hiragana": "べ" },
    "bi": { "remain": "", "katakana": "ビ", "hiragana": "び" },
    "bo": { "remain": "", "katakana": "ボ", "hiragana": "ぼ" },
    "bu": { "remain": "", "katakana": "ブ", "hiragana": "ぶ" },
    "bya": { "remain": "", "katakana": "ビャ", "hiragana": "びゃ" },
    "bye": { "remain": "", "katakana": "ビェ", "hiragana": "びぇ" },
    "byi": { "remain": "", "katakana": "ビィ", "hiragana": "びぃ" },
    "byo": { "remain": "", "katakana": "ビョ", "hiragana": "びょ" },
    "byu": { "remain": "", "katakana": "ビュ", "hiragana": "びゅ" },
    "cc": { "remain": "c", "katakana": "ッ", "hiragana": "っ" },
    "cha": { "remain": "", "katakana": "チャ", "hiragana": "ちゃ" },
    "che": { "remain": "", "katakana": "チェ", "hiragana": "ちぇ" },
    "chi": { "remain": "", "katakana": "チ", "hiragana": "ち" },
    "cho": { "remain": "", "katakana": "チョ", "hiragana": "ちょ" },
    "chu": { "remain": "", "katakana": "チュ", "hiragana": "ちゅ" },
    "cya": { "remain": "", "katakana": "チャ", "hiragana": "ちゃ" },
    "cye": { "remain": "", "katakana": "チェ", "hiragana": "ちぇ" },
    "cyi": { "remain": "", "katakana": "チィ", "hiragana": "ちぃ" },
    "cyo": { "remain": "", "katakana": "チョ", "hiragana": "ちょ" },
    "cyu": { "remain": "", "katakana": "チュ", "hiragana": "ちゅ" },
    "dd": { "remain": "d", "katakana": "ッ", "hiragana": "っ" },
    "da": { "remain": "", "katakana": "ダ", "hiragana": "だ" },
    "de": { "remain": "", "katakana": "デ", "hiragana": "で" },
    "dha": { "remain": "", "katakana": "デャ", "hiragana": "でゃ" },
    "dhe": { "remain": "", "katakana": "デェ", "hiragana": "でぇ" },
    "dhi": { "remain": "", "katakana": "ディ", "hiragana": "でぃ" },
    "dho": { "remain": "", "katakana": "デョ", "hiragana": "でょ" },
    "dhu": { "remain": "", "katakana": "デュ", "hiragana": "でゅ" },
    "di": { "remain": "", "katakana": "ヂ", "hiragana": "ぢ" },
    "do": { "remain": "", "katakana": "ド", "hiragana": "ど" },
    "du": { "remain": "", "katakana": "ヅ", "hiragana": "づ" },
    "dya": { "remain": "", "katakana": "ヂャ", "hiragana": "ぢゃ" },
    "dye": { "remain": "", "katakana": "ヂェ", "hiragana": "ぢぇ" },
    "dyi": { "remain": "", "katakana": "ヂィ", "hiragana": "ぢぃ" },
    "dyo": { "remain": "", "katakana": "ヂョ", "hiragana": "ぢょ" },
    "dyu": { "remain": "", "katakana": "ヂュ", "hiragana": "ぢゅ" },
    "e": { "remain": "", "katakana": "エ", "hiragana": "え" },
    "ff": { "remain": "f", "katakana": "ッ", "hiragana": "っ" },
    "fa": { "remain": "", "katakana": "ファ", "hiragana": "ふぁ" },
    "fe": { "remain": "", "katakana": "フェ", "hiragana": "ふぇ" },
    "fi": { "remain": "", "katakana": "フィ", "hiragana": "ふぃ" },
    "fo": { "remain": "", "katakana": "フォ", "hiragana": "ふぉ" },
    "fu": { "remain": "", "katakana": "フ", "hiragana": "ふ" },
    "fya": { "remain": "", "katakana": "フャ", "hiragana": "ふゃ" },
    "fye": { "remain": "", "katakana": "フェ", "hiragana": "ふぇ" },
    "fyi": { "remain": "", "katakana": "フィ", "hiragana": "ふぃ" },
    "fyo": { "remain": "", "katakana": "フョ", "hiragana": "ふょ" },
    "fyu": { "remain": "", "katakana": "フュ", "hiragana": "ふゅ" },
    "gg": { "remain": "g", "katakana": "ッ", "hiragana": "っ" },
    "ga": { "remain": "", "katakana": "ガ", "hiragana": "が" },
    "ge": { "remain": "", "katakana": "ゲ", "hiragana": "げ" },
    "gi": { "remain": "", "katakana": "ギ", "hiragana": "ぎ" },
    "go": { "remain": "", "katakana": "ゴ", "hiragana": "ご" },
    "gu": { "remain": "", "katakana": "グ", "hiragana": "ぐ" },
    "gya": { "remain": "", "katakana": "ギャ", "hiragana": "ぎゃ" },
    "gye": { "remain": "", "katakana": "ギェ", "hiragana": "ぎぇ" },
    "gyi": { "remain": "", "katakana": "ギィ", "hiragana": "ぎぃ" },
    "gyo": { "remain": "", "katakana": "ギョ", "hiragana": "ぎょ" },
    "gyu": { "remain": "", "katakana": "ギュ", "hiragana": "ぎゅ" },
    "ha": { "remain": "", "katakana": "ハ", "hiragana": "は" },
    "he": { "remain": "", "katakana": "ヘ", "hiragana": "へ" },
    "hi": { "remain": "", "katakana": "ヒ", "hiragana": "ひ" },
    "ho": { "remain": "", "katakana": "ホ", "hiragana": "ほ" },
    "hu": { "remain": "", "katakana": "フ", "hiragana": "ふ" },
    "hya": { "remain": "", "katakana": "ヒャ", "hiragana": "ひゃ" },
    "hye": { "remain": "", "katakana": "ヒェ", "hiragana": "ひぇ" },
    "hyi": { "remain": "", "katakana": "ヒィ", "hiragana": "ひぃ" },
    "hyo": { "remain": "", "katakana": "ヒョ", "hiragana": "ひょ" },
    "hyu": { "remain": "", "katakana": "ヒュ", "hiragana": "ひゅ" },
    "i": { "remain": "", "katakana": "イ", "hiragana": "い" },
    "jj": { "remain": "j", "katakana": "ッ", "hiragana": "っ" },
    "ja": { "remain": "", "katakana": "ジャ", "hiragana": "じゃ" },
    "je": { "remain": "", "katakana": "ジェ", "hiragana": "じぇ" },
    "ji": { "remain": "", "katakana": "ジ", "hiragana": "じ" },
    "jo": { "remain": "", "katakana": "ジョ", "hiragana": "じょ" },
    "ju": { "remain": "", "katakana": "ジュ", "hiragana": "じゅ" },
    "jya": { "remain": "", "katakana": "ジャ", "hiragana": "じゃ" },
    "jye": { "remain": "", "katakana": "ジェ", "hiragana": "じぇ" },
    "jyi": { "remain": "", "katakana": "ジィ", "hiragana": "じぃ" },
    "jyo": { "remain": "", "katakana": "ジョ", "hiragana": "じょ" },
    "jyu": { "remain": "", "katakana": "ジュ", "hiragana": "じゅ" },
    "kk": { "remain": "k", "katakana": "ッ", "hiragana": "っ" },
    "ka": { "remain": "", "katakana": "カ", "hiragana": "か" },
    "ke": { "remain": "", "katakana": "ケ", "hiragana": "け" },
    "ki": { "remain": "", "katakana": "キ", "hiragana": "き" },
    "ko": { "remain": "", "katakana": "コ", "hiragana": "こ" },
    "ku": { "remain": "", "katakana": "ク", "hiragana": "く" },
    "kya": { "remain": "", "katakana": "キャ", "hiragana": "きゃ" },
    "kye": { "remain": "", "katakana": "キェ", "hiragana": "きぇ" },
    "kyi": { "remain": "", "katakana": "キィ", "hiragana": "きぃ" },
    "kyo": { "remain": "", "katakana": "キョ", "hiragana": "きょ" },
    "kyu": { "remain": "", "katakana": "キュ", "hiragana": "きゅ" },
    "ma": { "remain": "", "katakana": "マ", "hiragana": "ま" },
    "me": { "remain": "", "katakana": "メ", "hiragana": "め" },
    "mi": { "remain": "", "katakana": "ミ", "hiragana": "み" },
    "mo": { "remain": "", "katakana": "モ", "hiragana": "も" },
    "mu": { "remain": "", "katakana": "ム", "hiragana": "む" },
    "mya": { "remain": "", "katakana": "ミャ", "hiragana": "みゃ" },
    "mye": { "remain": "", "katakana": "ミェ", "hiragana": "みぇ" },
    "myi": { "remain": "", "katakana": "ミィ", "hiragana": "みぃ" },
    "myo": { "remain": "", "katakana": "ミョ", "hiragana": "みょ" },
    "myu": { "remain": "", "katakana": "ミュ", "hiragana": "みゅ" },
    "n": { "remain": "", "katakana": "ン", "hiragana": "ん" },
    "n'": { "remain": "", "katakana": "ン", "hiragana": "ん" },
    "na": { "remain": "", "katakana": "ナ", "hiragana": "な" },
    "ne": { "remain": "", "katakana": "ネ", "hiragana": "ね" },
    "ni": { "remain": "", "katakana": "ニ", "hiragana": "に" },
    "nn": { "remain": "", "katakana": "ン", "hiragana": "ん" },
    "no": { "remain": "", "katakana": "ノ", "hiragana": "の" },
    "nu": { "remain": "", "katakana": "ヌ", "hiragana": "ぬ" },
    "nya": { "remain": "", "katakana": "ニャ", "hiragana": "にゃ" },
    "nye": { "remain": "", "katakana": "ニェ", "hiragana": "にぇ" },
    "nyi": { "remain": "", "katakana": "ニィ", "hiragana": "にぃ" },
    "nyo": { "remain": "", "katakana": "ニョ", "hiragana": "にょ" },
    "nyu": { "remain": "", "katakana": "ニュ", "hiragana": "にゅ" },
    "o": { "remain": "", "katakana": "オ", "hiragana": "お" },
    "pp": { "remain": "p", "katakana": "ッ", "hiragana": "っ" },
    "pa": { "remain": "", "katakana": "パ", "hiragana": "ぱ" },
    "pe": { "remain": "", "katakana": "ペ", "hiragana": "ぺ" },
    "pi": { "remain": "", "katakana": "ピ", "hiragana": "ぴ" },
    "po": { "remain": "", "katakana": "ポ", "hiragana": "ぽ" },
    "pu": { "remain": "", "katakana": "プ", "hiragana": "ぷ" },
    "pya": { "remain": "", "katakana": "ピャ", "hiragana": "ぴゃ" },
    "pye": { "remain": "", "katakana": "ピェ", "hiragana": "ぴぇ" },
    "pyi": { "remain": "", "katakana": "ピィ", "hiragana": "ぴぃ" },
    "pyo": { "remain": "", "katakana": "ピョ", "hiragana": "ぴょ" },
    "pyu": { "remain": "", "katakana": "ピュ", "hiragana": "ぴゅ" },
    "rr": { "remain": "r", "katakana": "ッ", "hiragana": "っ" },
    "ra": { "remain": "", "katakana": "ラ", "hiragana": "ら" },
    "re": { "remain": "", "katakana": "レ", "hiragana": "れ" },
    "ri": { "remain": "", "katakana": "リ", "hiragana": "り" },
    "ro": { "remain": "", "katakana": "ロ", "hiragana": "ろ" },
    "ru": { "remain": "", "katakana": "ル", "hiragana": "る" },
    "rya": { "remain": "", "katakana": "リャ", "hiragana": "りゃ" },
    "rye": { "remain": "", "katakana": "リェ", "hiragana": "りぇ" },
    "ryi": { "remain": "", "katakana": "リィ", "hiragana": "りぃ" },
    "ryo": { "remain": "", "katakana": "リョ", "hiragana": "りょ" },
    "ryu": { "remain": "", "katakana": "リュ", "hiragana": "りゅ" },
    "ss": { "remain": "s", "katakana": "ッ", "hiragana": "っ" },
    "sa": { "remain": "", "katakana": "サ", "hiragana": "さ" },
    "se": { "remain": "", "katakana": "セ", "hiragana": "せ" },
    "sha": { "remain": "", "katakana": "シャ", "hiragana": "しゃ" },
    "she": { "remain": "", "katakana": "シェ", "hiragana": "しぇ" },
    "shi": { "remain": "", "katakana": "シ", "hiragana": "し" },
    "sho": { "remain": "", "katakana": "ショ", "hiragana": "しょ" },
    "shu": { "remain": "", "katakana": "シュ", "hiragana": "しゅ" },
    "si": { "remain": "", "katakana": "シ", "hiragana": "し" },
    "so": { "remain": "", "katakana": "ソ", "hiragana": "そ" },
    "su": { "remain": "", "katakana": "ス", "hiragana": "す" },
    "sya": { "remain": "", "katakana": "シャ", "hiragana": "しゃ" },
    "sye": { "remain": "", "katakana": "シェ", "hiragana": "しぇ" },
    "syi": { "remain": "", "katakana": "シィ", "hiragana": "しぃ" },
    "syo": { "remain": "", "katakana": "ショ", "hiragana": "しょ" },
    "syu": { "remain": "", "katakana": "シュ", "hiragana": "しゅ" },
    "tt": { "remain": "t", "katakana": "ッ", "hiragana": "っ" },
    "ta": { "remain": "", "katakana": "タ", "hiragana": "た" },
    "te": { "remain": "", "katakana": "テ", "hiragana": "て" },
    "tha": { "remain": "", "katakana": "テァ", "hiragana": "てぁ" },
    "the": { "remain": "", "katakana": "テェ", "hiragana": "てぇ" },
    "thi": { "remain": "", "katakana": "ティ", "hiragana": "てぃ" },
    "tho": { "remain": "", "katakana": "テョ", "hiragana": "てょ" },
    "thu": { "remain": "", "katakana": "テュ", "hiragana": "てゅ" },
    "ti": { "remain": "", "katakana": "チ", "hiragana": "ち" },
    "to": { "remain": "", "katakana": "ト", "hiragana": "と" },
    "tsu": { "remain": "", "katakana": "ツ", "hiragana": "つ" },
    "tu": { "remain": "", "katakana": "ツ", "hiragana": "つ" },
    "tya": { "remain": "", "katakana": "チャ", "hiragana": "ちゃ" },
    "tye": { "remain": "", "katakana": "チェ", "hiragana": "ちぇ" },
    "tyi": { "remain": "", "katakana": "チィ", "hiragana": "ちぃ" },
    "tyo": { "remain": "", "katakana": "チョ", "hiragana": "ちょ" },
    "tyu": { "remain": "", "katakana": "チュ", "hiragana": "ちゅ" },
    "u": { "remain": "", "katakana": "ウ", "hiragana": "う" },
    "vv": { "remain": "v", "katakana": "ッ", "hiragana": "っ" },
    "va": { "remain": "", "katakana": "ヴァ", "hiragana": "う゛ぁ" },
    "ve": { "remain": "", "katakana": "ヴェ", "hiragana": "う゛ぇ" },
    "vi": { "remain": "", "katakana": "ヴィ", "hiragana": "う゛ぃ" },
    "vo": { "remain": "", "katakana": "ヴォ", "hiragana": "う゛ぉ" },
    "vu": { "remain": "", "katakana": "ヴ", "hiragana": "う゛" },
    "ww": { "remain": "w", "katakana": "ッ", "hiragana": "っ" },
    "wa": { "remain": "", "katakana": "ワ", "hiragana": "わ" },
    "we": { "remain": "", "katakana": "ウェ", "hiragana": "うぇ" },
    "wi": { "remain": "", "katakana": "ウィ", "hiragana": "うぃ" },
    "wo": { "remain": "", "katakana": "ヲ", "hiragana": "を" },
    "wu": { "remain": "", "katakana": "ウ", "hiragana": "う" },
    "xx": { "remain": "x", "katakana": "ッ", "hiragana": "っ" },
    "xa": { "remain": "", "katakana": "ァ", "hiragana": "ぁ" },
    "xe": { "remain": "", "katakana": "ェ", "hiragana": "ぇ" },
    "xi": { "remain": "", "katakana": "ィ", "hiragana": "ぃ" },
    "xka": { "remain": "", "katakana": "ヵ", "hiragana": "か" },
    "xke": { "remain": "", "katakana": "ヶ", "hiragana": "け" },
    "xo": { "remain": "", "katakana": "ォ", "hiragana": "ぉ" },
    "xtsu": { "remain": "", "katakana": "ッ", "hiragana": "っ" },
    "xtu": { "remain": "", "katakana": "ッ", "hiragana": "っ" },
    "xu": { "remain": "", "katakana": "ゥ", "hiragana": "ぅ" },
    "xwa": { "remain": "", "katakana": "ヮ", "hiragana": "ゎ" },
    "xwe": { "remain": "", "katakana": "ヱ", "hiragana": "ゑ" },
    "xwi": { "remain": "", "katakana": "ヰ", "hiragana": "ゐ" },
    "xya": { "remain": "", "katakana": "ャ", "hiragana": "ゃ" },
    "xyo": { "remain": "", "katakana": "ョ", "hiragana": "ょ" },
    "xyu": { "remain": "", "katakana": "ュ", "hiragana": "ゅ" },
    "yy": { "remain": "y", "katakana": "ッ", "hiragana": "っ" },
    "ya": { "remain": "", "katakana": "ヤ", "hiragana": "や" },
    "ye": { "remain": "", "katakana": "イェ", "hiragana": "いぇ" },
    "yo": { "remain": "", "katakana": "ヨ", "hiragana": "よ" },
    "yu": { "remain": "", "katakana": "ユ", "hiragana": "ゆ" },
    "zz": { "remain": "z", "katakana": "ッ", "hiragana": "っ" },
    "z ": { "remain": "", "hiragana": "　" },
    "z*": { "remain": "", "hiragana": "※" },
    "z,": { "remain": "", "hiragana": "‥" },
    "z-": { "remain": "", "hiragana": "〜" },
    "z.": { "remain": "", "hiragana": "…" },
    "z/": { "remain": "", "hiragana": "・" },
    "z0": { "remain": "", "hiragana": "○" },
    "z:": { "remain": "", "hiragana": "゜" },
    "z;": { "remain": "", "hiragana": "゛" },
    "z@": { "remain": "", "hiragana": "◎" },
    "z[": { "remain": "", "hiragana": "『" },
    "z]": { "remain": "", "hiragana": "』" },
    "z{": { "remain": "", "hiragana": "【" },
    "z}": { "remain": "", "hiragana": "】" },
    "z(": { "remain": "", "hiragana": "（" },
    "z)": { "remain": "", "hiragana": "）" },
    "za": { "remain": "", "katakana": "ザ", "hiragana": "ざ" },
    "ze": { "remain": "", "katakana": "ゼ", "hiragana": "ぜ" },
    "zh": { "remain": "", "hiragana": "←" },
    "zi": { "remain": "", "katakana": "ジ", "hiragana": "じ" },
    "zj": { "remain": "", "hiragana": "↓" },
    "zk": { "remain": "", "hiragana": "↑" },
    "zl": { "remain": "", "hiragana": "→" },
    "zL": { "remain": "", "hiragana": "⇒" },
    "zn": { "remain": "", "hiragana": "ー" },
    "zo": { "remain": "", "katakana": "ゾ", "hiragana": "ぞ" },
    "zu": { "remain": "", "katakana": "ズ", "hiragana": "ず" },
    "zya": { "remain": "", "katakana": "ジャ", "hiragana": "じゃ" },
    "zye": { "remain": "", "katakana": "ジェ", "hiragana": "じぇ" },
    "zyi": { "remain": "", "katakana": "ジィ", "hiragana": "じぃ" },
    "zyo": { "remain": "", "katakana": "ジョ", "hiragana": "じょ" },
    "zyu": { "remain": "", "katakana": "ジュ", "hiragana": "じゅ" }
};
