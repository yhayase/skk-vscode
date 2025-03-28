import { expect } from 'chai';
import { CompositeMap } from '../../../src/lib/composite-map';

describe('CompositeMap', () => {
    let compositeMap: CompositeMap<string, string>;
    let firstMap: Map<string, string>;
    let secondMap: Map<string, string>;

    beforeEach(() => {
        firstMap = new Map<string, string>();
        secondMap = new Map<string, string>();
        compositeMap = new CompositeMap([firstMap, secondMap]);
    });

    it('would throws assertion error on creating with empty array', () => {
        expect(() => new CompositeMap([])).to.throw();
    });

    it('has empty map when created', () => {
        expect(compositeMap.size).to.equal(0);
    });

    it('has size of 1 after adding one key-value pair', () => {
        compositeMap.set('key1', 'value1');
        expect(compositeMap.size).to.equal(1);
    });

    it('has size of 2 after adding two key-value pairs', () => {
        compositeMap.set('key1', 'value1');
        compositeMap.set('key2', 'value2');
        expect(compositeMap.size).to.equal(2);
    });

    it('stores and returns value by set and get methods', () => {
        compositeMap.set('key1', 'value1');
        expect(compositeMap.get('key1')).to.equal('value1');
    });

    it('stores the key-value pair in the first map', () => {
        compositeMap.set('key1', 'value1');
        expect(firstMap.get('key1')).to.equal('value1');
    });

    it('stores the key-value pair in the first map even if the key exists in the second map', () => {
        secondMap.set('key1', 'value1');
        compositeMap.set('key1', 'value2');

        expect(firstMap.get('key1')).to.equal('value2');
        expect(secondMap.get('key1')).to.equal('value1');
    });

    it('returns undefined for non-existent keys', () => {
        expect(compositeMap.get('nonExistentKey')).to.be.undefined;
    });

    it('only returns value from the first map', () => {
        firstMap.set('key1', 'value1');
        secondMap.set('key1', 'value2');
        expect(compositeMap.get('key1')).to.equal('value1');
    });

    it('counts once for duplicate keys', () => {
        firstMap.set('key1', 'value1');
        secondMap.set('key1', 'value2');
        expect(compositeMap.size).to.equal(1);
    });

    it('only changes the first map when setting a key-value pair', () => {
        firstMap.set('key1', 'value1');
        secondMap.set('key1', 'value2');
        compositeMap.set('key1', 'value3');

        expect(firstMap.get('key1')).to.equal('value3');
        expect(secondMap.get('key1')).to.equal('value2');
    });

    it('does not implement clear method', () => {
        expect(() => compositeMap.clear()).to.throw();
    });

    it('does not implement delete method', () => {
        expect(() => compositeMap.delete('key1')).to.throw();
    });

    it('provides deleteFromFirst method to delete from the first map', () => {
        firstMap.set('key1', 'value1');
        secondMap.set('key1', 'value2');
        compositeMap.deleteFromFirst('key1');

        expect(firstMap.get('key1')).to.be.undefined;
        expect(secondMap.get('key1')).to.equal('value2');
        expect(compositeMap.get('key1')).to.equal('value2');
    });

    it('iterates zero times for empty map', () => {
        let count = 0;
        compositeMap.forEach(() => count++);
        expect(count).to.equal(0);
    });

    it('iterates over all key-value pairs in the first map', () => {
        firstMap.set('key1', 'value1');
        firstMap.set('key2', 'value2');
        let count = 0;
        compositeMap.forEach(() => count++);
        expect(count).to.equal(2);
    });

    it('ignores duplicate keys on iteration', () => {
        firstMap.set('key1', 'value1');
        secondMap.set('key1', 'value2');
        let count = 0;
        compositeMap.forEach(() => count++);
        expect(count).to.equal(1);
    });

    it('returns false if the key does not exist in any entry maps', () => {
        expect(compositeMap.has('key1')).to.be.false;
    });

    it('retuns true if the key exists in the first map', () => {
        firstMap.set('key1', 'value1');
        expect(compositeMap.has('key1')).to.be.true;
    });

    it('returns true if the key exists in the second map', () => {
        secondMap.set('key1', 'value1');
        expect(compositeMap.has('key1')).to.be.true;
    });

    it('has string representation of "[object CompositeMap]"', () => {
        expect(compositeMap.toString()).to.equal('[object CompositeMap]');
    });
});