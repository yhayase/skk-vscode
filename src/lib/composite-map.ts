import assert = require("assert");

export class CompositeMap<K, V> implements Map<K, V> {
    protected maps: Map<K, V>[] = [];

    constructor(maps: Map<K, V>[]) {
        assert(maps.length > 0);
        this.maps = maps;
    }

    /**
     * Return the value from the first map that has the key.
     * @param key 
     * @returns 
     */
    get(key: K): V | undefined {
        for (const map of this.maps) {
            if (map.has(key)) {
                return map.get(key);
            }
        }
        return undefined;
    }

    /**
     * Set the value for the given key in the first map.
     * @param key 
     * @param value 
     * @returns 
     */
    set(key: K, value: V): this {
        this.maps[0].set(key, value);
        return this;
    }

    /**
     * Does not support this operation.
     * @param key 
     * @returns 
     */
    clear(): void {
        throw new Error("Method not implemented.");
    }
    /**
     * Does not support this operation.
     * @param key 
     * @returns 
     */
    delete(key: K): boolean {
        throw new Error("Method not implemented.");
    }

    /**
     * Delete the key from the first map.
     */
    deleteFromFirst(key: K): boolean {
        return this.maps[0].delete(key);
    }

    /**
     * Iterates over the all pairs of key and value.
     * Only the first pair in the maps is processed.
     * @param callbackfn 
     * @param thisArg 
     * @returns 
     */
    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
        for (let entry of this.entries()) {
            // treat thisArg as "this" in callbackfn
            if (thisArg === undefined) {
                callbackfn(entry[1], entry[0], this);
            } else {
                callbackfn.apply(thisArg, [entry[1], entry[0], this]);
            }
        }
    }

    /**
     * Checks if the key is in the maps.
     * @param key 
     */
    has(key: K): boolean {
        for (const map of this.maps) {
            if (map.has(key)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns iterator over the all pairs of key and value.
     */
    *entries(): IterableIterator<[K, V]> {
        let seen = new Set<K>();
        for (const map of this.maps) {
            for (const [key, value] of map.entries()) {
                if (!seen.has(key)) {
                    yield [key, value];
                    seen.add(key);
                }
            }
        }
    }

    *keys(): IterableIterator<K> {
        for (let entry of this.entries()) {
            yield entry[0];
        }
    }

    *values(): IterableIterator<V> {
        for (let entry of this.entries()) {
            yield entry[1];
        }
    }

    [Symbol.iterator](): IterableIterator<[K, V]> {
        return this.entries();
    }
    
    get size(): number {
        let seen = new Set<K>();
        for (const map of this.maps) {
            for (const key of map.keys()) {
                if (!seen.has(key)) {
                    seen.add(key);
                }
            }
        }
        return seen.size;
    }

    /**
     * Returns "CompositeMap" as the class name.
     */
    get [Symbol.toStringTag](): string {
        return "CompositeMap";
    }
}
