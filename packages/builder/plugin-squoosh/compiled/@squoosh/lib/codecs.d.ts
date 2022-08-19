interface DecodeModule extends EmscriptenWasm.Module {
    decode: (data: Uint8Array) => ImageData;
}
export interface ResizeOptions {
    width: number;
    height: number;
    method: 'triangle' | 'catrom' | 'mitchell' | 'lanczos3';
    premultiply: boolean;
    linearRGB: boolean;
}
export interface QuantOptions {
    numColors: number;
    dither: number;
}
export interface RotateOptions {
    numRotations: number;
}
declare global {
    type ImageData = import('./image_data.js').default;
    var ImageData: ImageData['constructor'];
}
import type { MozJPEGModule as MozJPEGEncodeModule } from '../../codecs/mozjpeg/enc/mozjpeg_enc';
import type { EncodeOptions as MozJPEGEncodeOptions } from '../../codecs/mozjpeg/enc/mozjpeg_enc';
import type { WebPModule as WebPEncodeModule } from '../../codecs/webp/enc/webp_enc';
import type { EncodeOptions as WebPEncodeOptions } from '../../codecs/webp/enc/webp_enc.js';
import type { AVIFModule as AVIFEncodeModule } from '../../codecs/avif/enc/avif_enc';
import type { EncodeOptions as AvifEncodeOptions } from '../../codecs/avif/enc/avif_enc.js';
import type { JXLModule as JXLEncodeModule } from '../../codecs/jxl/enc/jxl_enc';
import type { EncodeOptions as JxlEncodeOptions } from '../../codecs/jxl/enc/jxl_enc.js';
import type { WP2Module as WP2EncodeModule } from '../../codecs/wp2/enc/wp2_enc';
import type { EncodeOptions as WP2EncodeOptions } from '../../codecs/wp2/enc/wp2_enc.js';
import * as pngEncDec from '../../codecs/png/pkg/squoosh_png.js';
interface OxiPngEncodeOptions {
    level: number;
}
import ImageData from './image_data.js';
export declare const preprocessors: {
    readonly resize: {
        readonly name: "Resize";
        readonly description: "Resize the image before compressing";
        readonly instantiate: () => Promise<(buffer: Uint8Array, input_width: number, input_height: number, { width, height, method, premultiply, linearRGB }: ResizeOptions) => ImageData>;
        readonly defaultOptions: {
            readonly method: "lanczos3";
            readonly fitMethod: "stretch";
            readonly premultiply: true;
            readonly linearRGB: true;
        };
    };
    readonly quant: {
        readonly name: "ImageQuant";
        readonly description: "Reduce the number of colors used (aka. paletting)";
        readonly instantiate: () => Promise<(buffer: Uint8Array, width: number, height: number, { numColors, dither }: QuantOptions) => ImageData>;
        readonly defaultOptions: {
            readonly numColors: 255;
            readonly dither: 1;
        };
    };
    readonly rotate: {
        readonly name: "Rotate";
        readonly description: "Rotate image";
        readonly instantiate: () => Promise<(buffer: Uint8Array, width: number, height: number, { numRotations }: RotateOptions) => Promise<ImageData>>;
        readonly defaultOptions: {
            readonly numRotations: 0;
        };
    };
};
export declare const codecs: {
    readonly mozjpeg: {
        readonly name: "MozJPEG";
        readonly extension: "jpg";
        readonly detectors: readonly [RegExp];
        readonly dec: () => Promise<DecodeModule>;
        readonly enc: () => Promise<MozJPEGEncodeModule>;
        readonly defaultEncoderOptions: {
            readonly quality: 75;
            readonly baseline: false;
            readonly arithmetic: false;
            readonly progressive: true;
            readonly optimize_coding: true;
            readonly smoothing: 0;
            readonly color_space: 3;
            readonly quant_table: 3;
            readonly trellis_multipass: false;
            readonly trellis_opt_zero: false;
            readonly trellis_opt_table: false;
            readonly trellis_loops: 1;
            readonly auto_subsample: true;
            readonly chroma_subsample: 2;
            readonly separate_chroma_quality: false;
            readonly chroma_quality: 75;
        };
        readonly autoOptimize: {
            readonly option: "quality";
            readonly min: 0;
            readonly max: 100;
        };
    };
    readonly webp: {
        readonly name: "WebP";
        readonly extension: "webp";
        readonly detectors: readonly [RegExp];
        readonly dec: () => Promise<DecodeModule>;
        readonly enc: () => Promise<WebPEncodeModule>;
        readonly defaultEncoderOptions: {
            readonly quality: 75;
            readonly target_size: 0;
            readonly target_PSNR: 0;
            readonly method: 4;
            readonly sns_strength: 50;
            readonly filter_strength: 60;
            readonly filter_sharpness: 0;
            readonly filter_type: 1;
            readonly partitions: 0;
            readonly segments: 4;
            readonly pass: 1;
            readonly show_compressed: 0;
            readonly preprocessing: 0;
            readonly autofilter: 0;
            readonly partition_limit: 0;
            readonly alpha_compression: 1;
            readonly alpha_filtering: 1;
            readonly alpha_quality: 100;
            readonly lossless: 0;
            readonly exact: 0;
            readonly image_hint: 0;
            readonly emulate_jpeg_size: 0;
            readonly thread_level: 0;
            readonly low_memory: 0;
            readonly near_lossless: 100;
            readonly use_delta_palette: 0;
            readonly use_sharp_yuv: 0;
        };
        readonly autoOptimize: {
            readonly option: "quality";
            readonly min: 0;
            readonly max: 100;
        };
    };
    readonly avif: {
        readonly name: "AVIF";
        readonly extension: "avif";
        readonly detectors: readonly [RegExp];
        readonly dec: () => Promise<DecodeModule>;
        readonly enc: () => Promise<AVIFEncodeModule>;
        readonly defaultEncoderOptions: {
            readonly cqLevel: 33;
            readonly cqAlphaLevel: -1;
            readonly denoiseLevel: 0;
            readonly tileColsLog2: 0;
            readonly tileRowsLog2: 0;
            readonly speed: 6;
            readonly subsample: 1;
            readonly chromaDeltaQ: false;
            readonly sharpness: 0;
            readonly tune: 0;
        };
        readonly autoOptimize: {
            readonly option: "cqLevel";
            readonly min: 62;
            readonly max: 0;
        };
    };
    readonly jxl: {
        readonly name: "JPEG-XL";
        readonly extension: "jxl";
        readonly detectors: readonly [RegExp];
        readonly dec: () => Promise<DecodeModule>;
        readonly enc: () => Promise<JXLEncodeModule>;
        readonly defaultEncoderOptions: {
            readonly effort: 1;
            readonly quality: 75;
            readonly progressive: false;
            readonly epf: -1;
            readonly lossyPalette: false;
            readonly decodingSpeedTier: 0;
            readonly photonNoiseIso: 0;
            readonly lossyModular: false;
        };
        readonly autoOptimize: {
            readonly option: "quality";
            readonly min: 0;
            readonly max: 100;
        };
    };
    readonly wp2: {
        readonly name: "WebP2";
        readonly extension: "wp2";
        readonly detectors: readonly [RegExp];
        readonly dec: () => Promise<DecodeModule>;
        readonly enc: () => Promise<WP2EncodeModule>;
        readonly defaultEncoderOptions: {
            readonly quality: 75;
            readonly alpha_quality: 75;
            readonly effort: 5;
            readonly pass: 1;
            readonly sns: 50;
            readonly uv_mode: 0;
            readonly csp_type: 0;
            readonly error_diffusion: 0;
            readonly use_random_matrix: false;
        };
        readonly autoOptimize: {
            readonly option: "quality";
            readonly min: 0;
            readonly max: 100;
        };
    };
    readonly oxipng: {
        readonly name: "OxiPNG";
        readonly extension: "png";
        readonly detectors: readonly [RegExp];
        readonly dec: () => Promise<{
            decode: typeof pngEncDec.decode;
        }>;
        readonly enc: () => Promise<{
            encode: (buffer: Uint8ClampedArray | ArrayBuffer, width: number, height: number, opts: {
                level: number;
            }) => Uint8Array;
        }>;
        readonly defaultEncoderOptions: {
            readonly level: 2;
        };
        readonly autoOptimize: {
            readonly option: "level";
            readonly min: 6;
            readonly max: 1;
        };
    };
};
export { MozJPEGEncodeOptions, WebPEncodeOptions, AvifEncodeOptions, JxlEncodeOptions, WP2EncodeOptions, OxiPngEncodeOptions, };
//# sourceMappingURL=codecs.d.ts.map