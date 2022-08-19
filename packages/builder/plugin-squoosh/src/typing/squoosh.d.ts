declare module '@squoosh/lib' {
  export const enum MozJpegColorSpace {
    GRAYSCALE = 1,
    RGB,
    YCbCr,
  }

  export interface MozJPEGEncodeOptions {
    quality: number;
    baseline: boolean;
    arithmetic: boolean;
    progressive: boolean;
    optimize_coding: boolean;
    smoothing: number;
    color_space: MozJpegColorSpace;
    quant_table: number;
    trellis_multipass: boolean;
    trellis_opt_zero: boolean;
    trellis_opt_table: boolean;
    trellis_loops: number;
    auto_subsample: boolean;
    chroma_subsample: number;
    separate_chroma_quality: boolean;
    chroma_quality: number;
  }

  export interface WebPEncodeOptions {
    quality: number;
    target_size: number;
    target_PSNR: number;
    method: number;
    sns_strength: number;
    filter_strength: number;
    filter_sharpness: number;
    filter_type: number;
    partitions: number;
    segments: number;
    pass: number;
    show_compressed: number;
    preprocessing: number;
    autofilter: number;
    partition_limit: number;
    alpha_compression: number;
    alpha_filtering: number;
    alpha_quality: number;
    lossless: number;
    exact: number;
    image_hint: number;
    emulate_jpeg_size: number;
    thread_level: number;
    low_memory: number;
    near_lossless: number;
    use_delta_palette: number;
    use_sharp_yuv: number;
  }

  export const enum AVIFTune {
    auto,
    psnr,
    ssim,
  }

  export interface AvifEncodeOptions {
    cqLevel: number;
    denoiseLevel: number;
    cqAlphaLevel: number;
    tileRowsLog2: number;
    tileColsLog2: number;
    speed: number;
    subsample: number;
    chromaDeltaQ: boolean;
    sharpness: number;
    tune: AVIFTune;
  }

  export interface JxlEncodeOptions {
    effort: number;
    quality: number;
    progressive: boolean;
    epf: number;
    lossyPalette: boolean;
    decodingSpeedTier: number;
    photonNoiseIso: number;
    lossyModular: boolean;
  }

  export const enum UVMode {
    UVModeAdapt = 0, // Mix of 420 and 444 (per block)
    UVMode420, // All blocks 420
    UVMode444, // All blocks 444
    UVModeAuto, // Choose any of the above automatically
  }

  export const enum Csp {
    kYCoCg,
    kYCbCr,
    kCustom,
    kYIQ,
  }

  export interface WP2EncodeOptions {
    quality: number;
    alpha_quality: number;
    effort: number;
    pass: number;
    sns: number;
    uv_mode: UVMode;
    csp_type: Csp;
    error_diffusion: number;
    use_random_matrix: boolean;
  }

  export interface OxiPngEncodeOptions {
    level: number;
  }

  export interface Codec<T extends Decoder> {
    name: string;
    extension: string;
    detectors: RegExp[];
    dec: () => any;
    enc: () => any;
    defaultEncoderOptions: DecoderCollection<T>;
    autoOptimize: {
      option: string;
      min: number;
      max: number;
    };
  }

  export interface DecoderCollection {
    mozjpeg: MozJPEGEncodeOptions;
    webp: WebPEncodeOptions;
    avif: AvifEncodeOptions;
    jxl: JxlEncodeOptions;
    wp2: WP2EncodeOptions;
    oxipng: OxiPngEncodeOptions;
  }

  export type Decoder = keyof DecoderCollection;

  export const encoders: { [K in Decoder]: Codec<K> };

  /**
   * A pool where images can be ingested and squooshed.
   */
  class ImagePool {
    public workerPool: WorkerPool<JobMessage, any>;

    /**
     * Create a new pool.
     * @param {number} [threads] - Number of concurrent image processes to run in the pool.
     */
    constructor(threads: number) {
      this.workerPool = new WorkerPool(threads, __filename);
    }

    /**
     * Ingest an image into the image pool.
     * @param {ArrayBuffer | ArrayLike<number>} file - The image that should be ingested and decoded.
     * @returns {Image} - A custom class reference to the decoded image.
     */
    ingestImage(file: ArrayBuffer | ArrayLike<number>): Image {
      return new Image(this.workerPool, file);
    }

    /**
     * Closes the underlying image processing pipeline. The already processed images will still be there, but no new processing can start.
     * @returns {Promise<void>} - A promise that resolves when the underlying pipeline has closed.
     */
    async close(): Promise<void> {
      await this.workerPool.join();
    }
  }
}
