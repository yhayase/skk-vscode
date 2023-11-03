import * as assert from 'assert';
import { RomajiInput } from "../../../RomajiInput";

suite('RomajiInput.romToHiragana test', () => {
	test('空の入力に対して空の結果を返す', () => {
        assert.deepEqual(RomajiInput["romToHiragana"](""), ["", ""]);
	});

	test('母音アルファベット一文字の入力に対してひらがな1文字を返す', () => {
        assert.deepEqual(RomajiInput["romToHiragana"]("a"), ["あ", ""]);
	});

	test('子音のみの入力に対してひらがなを作らずに入力をそのまま返す', () => {
        assert.deepEqual(RomajiInput["romToHiragana"]("k"), ["", "k"]);
	});

	test('通常の子音+母音の入力に対してひらがなを返す', () => {
        assert.deepEqual(RomajiInput["romToHiragana"]("si"), ["し", ""]);
	});

	test('n一文字の入力に対して未変換のnだけを返す', () => {
        assert.deepEqual(RomajiInput["romToHiragana"]("n"), ["", "n"]);
	});

	test('n二文字の入力に対して「ん」を返す', () => {
        assert.deepEqual(RomajiInput["romToHiragana"]("nn"), ["ん", ""]);
	});

	test('n+母音の入力に対してひらがな一文字を返す', () => {
        assert.deepEqual(RomajiInput["romToHiragana"]("ne"), ["ね", ""]);
	});

	test('nkという入力に対して「ん」と未変換のkを返す', () => {
        assert.deepEqual(RomajiInput["romToHiragana"]("nk"), ["ん", "k"]);
	});

	test('nyという入力に対して未変換のnyを返す', () => {
		assert.deepEqual(RomajiInput["romToHiragana"]("ny"), ["", "ny"]);
	});

	test('拗音を含むローマ字の入力を取り扱える', () => {
        assert.deepEqual(RomajiInput["romToHiragana"]("tyu"), ["ちゅ", ""]);
	});

	test('子音2つの連続に対して「っ」と未変換の子音を返す', () => {
		assert.deepEqual(RomajiInput["romToHiragana"]("yy"), ["っ", "y"]);
	});

	test('ローマ字表に存在しない文字の入力に対して空の結果を返す', () => {
		assert.deepEqual(RomajiInput["romToHiragana"]("あ"), ["", ""]);
	});

	test('ローマ字表に存在しないアルファベット2文字の並びに対して候補がありうるサフィックスを返す', () => {
		assert.deepEqual(RomajiInput["romToHiragana"]("ht"), ["", "t"]);
	});

	test('ローマ字表に存在しないアルファベット3文字の並びに対して候補がありうるサフィックスを返す', () => {
		assert.deepEqual(RomajiInput["romToHiragana"]("cht"), ["", "t"]);
	});
});


