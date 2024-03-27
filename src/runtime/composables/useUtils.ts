class Utils {
  trimWithSymbol(str: string, symbol: string): string {
    const startTrim = str.startsWith(symbol);
    const endTrim = str.endsWith(symbol);

    return str.substring(startTrim ? symbol.length : 0, endTrim ? str.length - symbol.length : undefined);
  }
  trimStartWithSymbol(str: string, symbol: string): string {
    const startTrim = str.startsWith(symbol);

    return str.substring(startTrim ? symbol.length : 0);
  }
  trimEndWithSymbol(str: string, symbol: string): string {
    const endTrim = str.endsWith(symbol);

    return str.substring(0, endTrim ? str.length - symbol.length : str.length);
  }
}

const utils = new Utils();
export type UseUtils = typeof Utils;
export default function () {
  return utils;
}
