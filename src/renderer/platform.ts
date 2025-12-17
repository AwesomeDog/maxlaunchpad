const platform = (typeof navigator !== 'undefined' ? navigator.platform : '').toLowerCase();

export const IS_MAC = platform.includes('mac');

export const IS_WINDOWS = platform.includes('win');

export const IS_LINUX = platform.includes('linux') && !IS_MAC && !IS_WINDOWS;
