export type ParseClassResult = [re: RegExp, consumed: number];
export type Form = 'NFC' | 'NFD' | 'NFKC' | 'NFKD';
export declare const parseClass: (glob: string, position: number, nocase?: boolean, form?: Form) => ParseClassResult;
