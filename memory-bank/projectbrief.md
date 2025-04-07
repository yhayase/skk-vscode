# Project Brief: skk-vscode

## Overview
skk-vscode is a VSCode extension that implements the SKK (Simple Kana to Kanji) Japanese input method within the VSCode editor. SKK was originally developed for Emacs, and this project aims to bring its functionality to VSCode.

## Core Requirements

1. **Japanese Input Method**
   - Implement a complete SKK-style Japanese input system within VSCode
   - Support various input modes (Hiragana, Katakana, ASCII, Zenkaku)
   - Enable conversion from kana to kanji using dictionary lookups

2. **Dictionary System**
   - Support multiple dictionaries
   - Allow configuration of dictionary sources
   - Enable postal code dictionary support

3. **Conversion Features**
   - Support inline conversion for the first 3 candidates
   - Implement menu-based conversion for additional candidates
   - Handle okurigana (送り仮名) in conversions

4. **Dictionary Registration**
   - Allow users to register new word-reading pairs to the user dictionary
   - Implement a registration workflow that matches SKK conventions

## Project Goals

1. **Usability**
   - Create a seamless Japanese input experience within VSCode
   - Match DDSKK (Emacs SKK implementation) behavior where possible
   - Work around VSCode extension limitations when necessary

2. **Performance**
   - Ensure responsive input and conversion
   - Optimize dictionary lookups

3. **Extensibility**
   - Design the system to be maintainable and extensible
   - Use clear abstractions between components

## Current Version
0.0.2

## Development Focus
The current development focus is on implementing the dictionary registration feature, which allows users to add new word-reading pairs to their user dictionary.
