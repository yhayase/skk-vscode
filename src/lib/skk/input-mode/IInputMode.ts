export interface IInputMode {
    reset: () => void;
    lowerAlphabetInput: (key: string) => void | Promise<void>;
    upperAlphabetInput: (key: string) => void | Promise<void>;
    spaceInput: () => void | Promise<void>;
    ctrlJInput: () => void | Promise<void>;
    ctrlGInput: () => void | Promise<void>;
    enterInput: () => void | Promise<void>;
    backspaceInput: () => void | Promise<void>;
    numberInput: (key: string) => void | Promise<void>;
    symbolInput: (key: string) => void | Promise<void>;
    getActiveKeys: () => Set<string>; // Returns a set of normalized key names active in this mode
    getContextualName: () => string; // Returns a string representation of the mode for context (e.g., "ascii", "hiragana:kakutei")
};
