import type ImageData from './image_data';
interface BinarySearchParams {
    min?: number;
    max?: number;
    epsilon?: number;
    maxRounds?: number;
}
interface AutoOptimizeParams extends BinarySearchParams {
    butteraugliDistanceGoal?: number;
}
interface AutoOptimizeResult {
    bitmap: ImageData;
    binary: Uint8Array;
    quality: number;
}
export declare function binarySearch(measureGoal: number, measure: (val: number) => Promise<number>, { min, max, epsilon, maxRounds }?: BinarySearchParams): Promise<{
    parameter: number;
    round: number;
    value: number;
}>;
export declare function autoOptimize(bitmapIn: ImageData, encode: (bitmap: ImageData, quality: number) => Promise<Uint8Array> | Uint8Array, decode: (binary: Uint8Array) => Promise<ImageData> | ImageData, { butteraugliDistanceGoal, ...binarySearchParams }?: AutoOptimizeParams): Promise<AutoOptimizeResult>;
export {};
//# sourceMappingURL=auto-optimizer.d.ts.map