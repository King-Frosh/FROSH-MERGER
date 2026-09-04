import { getJSZip } from "./load";

export interface CompressOptions {
  level: number; // 1..9
  optimizeImages: boolean;
  imageQuality: number; // 0..1
}

export interface CompressItem {
  name: string;
  originalSize: number;
  resultSize: number;
  kind: "optimized" | "deflated" | "stored";
  error?: boolean;
}

export interface CompressReport {
  items: CompressItem[];
  totalOriginal: number;
  totalResult: number;
  blob: Blob;
  filename: string;
}

const IMAGE_RE = /\.(png|jpe?g|webp|bmp|tiff?|gif)$/i;

const baseName = (name: string) => name.replace(/\.[^.]+$/, "") || "file";

async function fileToBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

async function optimizeImage(file: File, quality: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality)
  );
  if (!blob) throw new Error("Encoding failed");
  return blob;
}

async function estimateDeflatedSize(JSZip: any, file: File, level: number): Promise<number> {
  const zip = new JSZip();
  const buf = await fileToBuffer(file);
  zip.file(file.name, buf);
  const out = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level },
  });
  return out.size;
}

export async function compressFiles(
  files: File[],
  opts: CompressOptions
): Promise<CompressReport> {
  const JSZip = await getJSZip();
  const zip = new JSZip();
  const items: CompressItem[] = [];

  for (const file of files) {
    const isImage = opts.optimizeImages && IMAGE_RE.test(file.name);
    try {
      if (isImage) {
        const optimized = await optimizeImage(file, opts.imageQuality);
        const newName = `${baseName(file.name)}.webp`;
        zip.file(newName, optimized);
        items.push({
          name: newName,
          originalSize: file.size,
          resultSize: optimized.size,
          kind: "optimized",
        });
      } else {
        const buf = await fileToBuffer(file);
        zip.file(file.name, buf);
        const deflated = await estimateDeflatedSize(JSZip, file, opts.level);
        items.push({
          name: file.name,
          originalSize: file.size,
          resultSize: deflated,
          kind: "deflated",
        });
      }
    } catch {
      zip.file(file.name, file);
      items.push({
        name: file.name,
        originalSize: file.size,
        resultSize: file.size,
        kind: "stored",
        error: true,
      });
    }
  }

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: opts.level },
  });

  const totalOriginal = items.reduce((s, i) => s + i.originalSize, 0);
  const totalResult = items.reduce((s, i) => s + i.resultSize, 0);

  return {
    items,
    totalOriginal,
    totalResult,
    blob,
    filename: "compressed-files.zip",
  };
}
