export const IS_WINDOWS = navigator.userAgent.includes("Windows");
export const IS_LINUX = !IS_WINDOWS;

export const SYSTEM_NAME = IS_WINDOWS ? "Windows" : "Linux";

export const SUPER_KEY = IS_WINDOWS ? "Win" : "Super";
