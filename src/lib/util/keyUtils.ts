/**
 * Normalizes a keybinding string from package.json format to a consistent internal format.
 * - Converts to lowercase.
 * - Ensures consistent modifier order (e.g., ctrl+shift+alt+key).
 *
 * Examples:
 * - "Shift+A" -> "shift+a"
 * - "CTRL+J" -> "ctrl+j"
 * - "Space" -> "space"
 * - "Escape" -> "escape"
 *
 * This function is crucial for matching keys from getActiveKeys() with
 * the keys used in when-clause contexts (skk.activeKey.[NORMALIZED_KEY]).
 *
 * Note: package.json keybindings are already case-insensitive for basic keys (a-z),
 * but modifiers might have different casings. VSCode's internal representation
 * seems to prefer lowercase.
 */
export function normalizeVscodeKey(vscodeKey: string): string {
    const parts = vscodeKey.toLowerCase().split('+');
    const key = parts.pop() || ''; // The actual key is the last part

    // Sort modifiers to ensure consistent order
    const modifiers = parts.sort((a, b) => {
        // Define a canonical order for modifiers
        const order: { [key: string]: number } = { 'ctrl': 1, 'shift': 2, 'alt': 3, 'meta': 4 };
        return (order[a] || 99) - (order[b] || 99);
    });

    if (modifiers.length > 0) {
        return `${modifiers.join('+')}+${key}`;
    }
    return key;
}

/**
 * Generates the context key string for skk.activeKey.*
 * @param normalizedKey A key name already normalized by normalizeVscodeKey or from getActiveKeys()
 *                      (e.g., "a", "space", "ctrl+j", ".", "shift+a")
 */
export function getActiveKeyContext(normalizedKey: string): string {
    let safeKey = normalizedKey.toLowerCase(); // Ensure lowercase for consistency

    // Handle special key names that are not single characters or have standard keywords
    if (safeKey === ' ') {safeKey = 'space';}
    else if (safeKey === '.') {safeKey = 'dot';}
    else if (safeKey === ',') {safeKey = 'comma';}
    else if (safeKey === '/') {safeKey = 'slash';}
    else if (safeKey === '-') {safeKey = 'hyphen';} // Changed from 'dash' to avoid potential conflict if 'dash' is a key
    // Handle numeric keys by prefixing
    else if (safeKey >= '0' && safeKey <= '9') {safeKey = `num${safeKey}`;}
    else if (safeKey === 'escape') {safeKey = 'escape';}
    else if (safeKey === 'backspace') {safeKey = 'backspace';}
    else if (safeKey === 'enter') {safeKey = 'enter';}
    // Add more explicit mappings for symbols if needed:
    // else if (safeKey === '!') safeKey = 'exclamation';
    // else if (safeKey === '@') safeKey = 'at';
    // ... etc.

    // Replace '+' with '_' for modifiers
    safeKey = safeKey.replace(/\+/g, '_');

    // Sanitize for any other characters that might not be valid in context key names
    // This regex keeps a-z, 0-9, and _.
    safeKey = safeKey.replace(/[^a-z0-9_]/g, '');

    if (!safeKey) {
        console.warn(`SKK: Could not generate safe context key for normalizedKey: ${normalizedKey}`);
        return 'skk.activeKey.invalidOrUnmappedKey'; // Should not happen with proper normalization
    }
    return `skk.activeKey.${safeKey}`;
}

// Example usage (for testing/dev):
// console.log(normalizeVscodeKey("Shift+A")); // "shift+a"
// console.log(normalizeVscodeKey("ctrl+Shift+b")); // "ctrl+shift+b"
// console.log(normalizeVscodeKey("Space")); // "space"
// console.log(normalizeVscodeKey("ESCAPE")); // "escape"
