export interface ImageSize {
  width: number;
  height: number;
}

export interface ImageResource extends ImageSize {
  src: string;
}

export interface ImageModule extends ImageResource {
  thumbnail?: ImageResource;
}
