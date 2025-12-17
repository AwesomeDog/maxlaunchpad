export const APP_NAME = 'MaxLaunchpad';

export const APP_DESCRIPTION = `${APP_NAME} is a simple, reliable launcher that makes your most-used applications instantly accessible from the keyboard`;

export const DOCUMENTATION_URL = 'https://awesomedog.github.io/maxlaunchpad/';

export const FUNCTION_KEYS = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10'] as const;

export const NUM_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as const;

export const LETTER_KEYS_LAYOUT = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'],
] as const;

export const LETTER_KEYS = LETTER_KEYS_LAYOUT.flat();
export type FunctionKeyId = (typeof FUNCTION_KEYS)[number];
export type NumKeyId = (typeof NUM_KEYS)[number];
export type LetterKeyId = (typeof LETTER_KEYS)[number];

export interface ModifierKeyDef {
  id: string; // Storage value: Ctrl, Alt, Shift, Win
  macLabel: string; // Display label on macOS
  winLabel: string; // Display label on Windows/Linux
}

export const MODIFIER_KEYS: ModifierKeyDef[] = [
  { id: 'Ctrl', macLabel: 'Control (⌃)', winLabel: 'Ctrl' },
  { id: 'Alt', macLabel: 'Option (⌥)', winLabel: 'Alt' },
  { id: 'Shift', macLabel: 'Shift (⇧)', winLabel: 'Shift' },
  { id: 'Win', macLabel: 'Command (⌘)', winLabel: 'Win' },
];

export const DEFAULT_MODIFIER = 'Alt';

// Electron Accelerator format mapping table
export const CODE_TO_ACCELERATOR: Record<string, string> = {
  // Letter keys A-Z
  KeyA: 'A',
  KeyB: 'B',
  KeyC: 'C',
  KeyD: 'D',
  KeyE: 'E',
  KeyF: 'F',
  KeyG: 'G',
  KeyH: 'H',
  KeyI: 'I',
  KeyJ: 'J',
  KeyK: 'K',
  KeyL: 'L',
  KeyM: 'M',
  KeyN: 'N',
  KeyO: 'O',
  KeyP: 'P',
  KeyQ: 'Q',
  KeyR: 'R',
  KeyS: 'S',
  KeyT: 'T',
  KeyU: 'U',
  KeyV: 'V',
  KeyW: 'W',
  KeyX: 'X',
  KeyY: 'Y',
  KeyZ: 'Z',
  // Main keyboard digit keys 0-9
  Digit0: '0',
  Digit1: '1',
  Digit2: '2',
  Digit3: '3',
  Digit4: '4',
  Digit5: '5',
  Digit6: '6',
  Digit7: '7',
  Digit8: '8',
  Digit9: '9',
  // Numpad keys
  Numpad0: 'num0',
  Numpad1: 'num1',
  Numpad2: 'num2',
  Numpad3: 'num3',
  Numpad4: 'num4',
  Numpad5: 'num5',
  Numpad6: 'num6',
  Numpad7: 'num7',
  Numpad8: 'num8',
  Numpad9: 'num9',
  NumpadAdd: 'numadd',
  NumpadSubtract: 'numsub',
  NumpadMultiply: 'nummult',
  NumpadDivide: 'numdiv',
  NumpadDecimal: 'numdec',
  NumpadEnter: 'Enter',
  // Function keys F1-F24
  F1: 'F1',
  F2: 'F2',
  F3: 'F3',
  F4: 'F4',
  F5: 'F5',
  F6: 'F6',
  F7: 'F7',
  F8: 'F8',
  F9: 'F9',
  F10: 'F10',
  F11: 'F11',
  F12: 'F12',
  F13: 'F13',
  F14: 'F14',
  F15: 'F15',
  F16: 'F16',
  F17: 'F17',
  F18: 'F18',
  F19: 'F19',
  F20: 'F20',
  F21: 'F21',
  F22: 'F22',
  F23: 'F23',
  F24: 'F24',
  // Special keys
  Space: 'Space',
  Tab: 'Tab',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Insert: 'Insert',
  Enter: 'Enter',
  Escape: 'Escape',
  // Arrow and navigation keys
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  // Symbol keys
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  // Media keys
  MediaPlayPause: 'MediaPlayPause',
  MediaStop: 'MediaStop',
  MediaTrackNext: 'MediaNextTrack',
  MediaTrackPrevious: 'MediaPreviousTrack',
  AudioVolumeUp: 'VolumeUp',
  AudioVolumeDown: 'VolumeDown',
  AudioVolumeMute: 'VolumeMute',
};

// Keys to ignore (modifiers and lock keys)
export const IGNORED_KEYS = new Set([
  'Control',
  'Alt',
  'Shift',
  'Meta',
  'Command',
  'Option',
  'CapsLock',
  'NumLock',
  'ScrollLock',
]);
