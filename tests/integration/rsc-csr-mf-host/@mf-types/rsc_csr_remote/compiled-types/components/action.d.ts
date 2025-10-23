import 'server-only';
export declare function greet(name: string): Promise<string>;
export declare function increment(num: number): Promise<number>;
export declare function incrementByForm(prevResult: number, formData: FormData): Promise<number>;
