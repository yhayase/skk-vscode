import { expect } from 'chai';
import { RomajiInput } from '../../RomajiInput';

describe('RomajiInput', () => {
    let romajiInput: RomajiInput;

    beforeEach(() => {
        // Initialize the RomajiInput instance before each test
        romajiInput = new RomajiInput();
    });

    afterEach(() => {
        // Clean up any resources after each test
    });

    it('converts a to あ', () => {
        expect(romajiInput.processInput('a')).equal('あ');
        expect(romajiInput.getRemainingRomaji()).equal('');
    });

    it('takes partial romaji input and keeps it in the remaining buffer', () => {
        expect(romajiInput.processInput('k')).equal('');
        expect(romajiInput.getRemainingRomaji()).equal('k');
        expect(romajiInput.findExactKanaForRomBuffer()).to.be.undefined;
    });

    it('takes consoants and vowels separately', () => {
        expect(romajiInput.processInput('k')).equal('');
        expect(romajiInput.processInput('i')).equal('き');
        expect(romajiInput.getRemainingRomaji()).equal('');
    });

    it('discards invalid romaji input', () => {
        expect(romajiInput.processInput('q')).equal('');
        expect(romajiInput.getRemainingRomaji()).equal('');
    });

    it('converts three character romaji e.g. kya to きゃ', () => {
        expect(romajiInput.processInput('kyu')).equal('きゅ');
        expect(romajiInput.getRemainingRomaji()).equal('');
    });

    it('discards invalid prefix of romaji, e.g. ste is converted to て', () => {
        expect(romajiInput.processInput('s')).equal('');
        expect(romajiInput.getRemainingRomaji()).equal('s');
        expect(romajiInput.processInput('t')).equal('');
        expect(romajiInput.getRemainingRomaji()).equal('t');
        expect(romajiInput.processInput('e')).equal('て');
        expect(romajiInput.getRemainingRomaji()).equal('');
    });

    it('converts romaji with n', () => {
        expect(romajiInput.processInput('n')).equal('');
        expect(romajiInput.getRemainingRomaji()).equal('n');
        expect(romajiInput.processInput('t')).equal('ん');
        expect(romajiInput.getRemainingRomaji()).equal('t');
        expect(romajiInput.processInput('o')).equal('と');
        expect(romajiInput.getRemainingRomaji()).equal('');
    });

    it('converts nn to single ん', () => {
        expect(romajiInput.processInput('n')).equal('');
        expect(romajiInput.getRemainingRomaji()).equal('n');
        expect(romajiInput.processInput('n')).equal('ん');
        expect(romajiInput.getRemainingRomaji()).equal('');
    });

    it('clears the remaining buffer when reset is called', () => {
        expect(romajiInput.processInput('k')).equal('');
        expect(romajiInput.getRemainingRomaji()).equal('k');
        romajiInput.reset();
        expect(romajiInput.getRemainingRomaji()).equal('');
    });

    it('starts in empty state', () => {
        expect(romajiInput.isEmpty()).to.be.true;
    });

    it('can delete the last character from the romaji buffer', () => {
        expect(romajiInput.processInput('m')).equal('');
        expect(romajiInput.getRemainingRomaji()).equal('m');
        romajiInput.deleteLastChar();
        expect(romajiInput.getRemainingRomaji()).equal('');
    });
});