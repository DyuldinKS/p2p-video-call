export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export const createLogger = (prefix: string): Logger => {
  const getTs = { toString: () => new Date().toISOString() };
  const tsParts = ['%c%s', 'color:#999;', getTs] as const;
  return {
    debug: console.debug.bind(console, ...tsParts, `[${prefix}]`),
    info: console.info.bind(console, ...tsParts, `[${prefix}]`),
    warn: console.warn.bind(console, ...tsParts, `[${prefix}]`),
    error: console.error.bind(console, ...tsParts, `[${prefix}]`),
  };
}
