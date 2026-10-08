// exifr's lite bundle (JPEG + HEIC, TIFF/EXIF/GPS) ships without its own typings;
// it exposes the same API as the main entry.
declare module 'exifr/dist/lite.esm.mjs' {
	export * from 'exifr';
	export { default } from 'exifr';
}
