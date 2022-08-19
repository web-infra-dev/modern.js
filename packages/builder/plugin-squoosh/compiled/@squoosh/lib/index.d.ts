import { AvifEncodeOptions, codecs as encoders, JxlEncodeOptions, MozJPEGEncodeOptions, OxiPngEncodeOptions, preprocessors, QuantOptions, ResizeOptions, RotateOptions, WebPEncodeOptions, WP2EncodeOptions } from './codecs.js';
import WorkerPool from './worker_pool.js';
import type ImageData from './image_data';
export { ImagePool, encoders, preprocessors };
declare type EncoderKey = keyof typeof encoders;
declare type PreprocessorKey = keyof typeof preprocessors;
declare type PreprocessOptions = {
    resize?: Partial<Omit<ResizeOptions, 'width' | 'height'>> & (Pick<ResizeOptions, 'width'> | Pick<ResizeOptions, 'height'>);
    quant?: Partial<QuantOptions>;
    rotate?: Partial<RotateOptions>;
};
declare type EncodeResult = {
    optionsUsed: object;
    binary: Uint8Array;
    extension: string;
    size: number;
};
declare type EncoderOptions = {
    mozjpeg?: Partial<MozJPEGEncodeOptions>;
    webp?: Partial<WebPEncodeOptions>;
    avif?: Partial<AvifEncodeOptions>;
    jxl?: Partial<JxlEncodeOptions>;
    wp2?: Partial<WP2EncodeOptions>;
    oxipng?: Partial<OxiPngEncodeOptions>;
};
declare function decodeFile({ file, }: {
    file: ArrayBuffer | ArrayLike<number>;
}): Promise<{
    bitmap: ImageData;
    size: number;
}>;
declare function preprocessImage({ preprocessorName, options, image, }: {
    preprocessorName: PreprocessorKey;
    options: any;
    image: {
        bitmap: ImageData;
    };
}): Promise<{
    bitmap: ImageData;
}>;
declare function encodeImage({ bitmap: bitmapIn, encName, encConfig, optimizerButteraugliTarget, maxOptimizerRounds, }: {
    bitmap: ImageData;
    encName: EncoderKey;
    encConfig: any;
    optimizerButteraugliTarget: number;
    maxOptimizerRounds: number;
}): Promise<EncodeResult>;
declare type EncodeParams = {
    operation: 'encode';
} & Parameters<typeof encodeImage>[0];
declare type DecodeParams = {
    operation: 'decode';
} & Parameters<typeof decodeFile>[0];
declare type PreprocessParams = {
    operation: 'preprocess';
} & Parameters<typeof preprocessImage>[0];
declare type JobMessage = EncodeParams | DecodeParams | PreprocessParams;
/**
 * Represents an ingested image.
 */
declare class Image {
    file: ArrayBuffer | ArrayLike<number>;
    workerPool: WorkerPool<JobMessage, any>;
    decoded: Promise<{
        bitmap: ImageData;
    }>;
    encodedWith: {
        [key in EncoderKey]?: EncodeResult;
    };
    constructor(workerPool: WorkerPool<JobMessage, any>, file: ArrayBuffer | ArrayLike<number>);
    /**
     * Define one or several preprocessors to use on the image.
     * @param {PreprocessOptions} preprocessOptions - An object with preprocessors to use, and their settings.
     * @returns {Promise<undefined>} - A promise that resolves when all preprocessors have completed their work.
     */
    preprocess(preprocessOptions?: PreprocessOptions): Promise<void>;
    /**
     * Define one or several encoders to use on the image.
     * @param {object} encodeOptions - An object with encoders to use, and their settings.
     * @returns {Promise<{ [key in keyof T]: EncodeResult }>} - A promise that resolves when the image has been encoded with all the specified encoders.
     */
    encode<T extends EncoderOptions>(encodeOptions: {
        optimizerButteraugliTarget?: number;
        maxOptimizerRounds?: number;
    } & T): Promise<{
        [key in keyof T]: EncodeResult;
    }>;
}
/**
 * A pool where images can be ingested and squooshed.
 */
declare class ImagePool {
    workerPool: WorkerPool<JobMessage, any>;
    /**
     * Create a new pool.
     * @param {number} [threads] - Number of concurrent image processes to run in the pool.
     */
    constructor(threads: number);
    /**
     * Ingest an image into the image pool.
     * @param {ArrayBuffer | ArrayLike<number>} file - The image that should be ingested and decoded.
     * @returns {Image} - A custom class reference to the decoded image.
     */
    ingestImage(file: ArrayBuffer | ArrayLike<number>): Image;
    /**
     * Closes the underlying image processing pipeline. The already processed images will still be there, but no new processing can start.
     * @returns {Promise<void>} - A promise that resolves when the underlying pipeline has closed.
     */
    close(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map