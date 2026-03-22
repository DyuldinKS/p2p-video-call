import { fromBase64, streamToBytes, toBase64 } from './bytes';

const enc = new TextEncoder();
const dec = new TextDecoder();

export const compressSdp = async (sdp: string): Promise<string> => {
  const stream = new Blob([enc.encode(sdp)])
    .stream()
    .pipeThrough(new CompressionStream('deflate-raw'));
  return toBase64(await streamToBytes(stream));
}

export const decompressSdp = async (b64: string): Promise<string> => {
  const stream = new Blob([fromBase64(b64).buffer as ArrayBuffer])
    .stream()
    .pipeThrough(new DecompressionStream('deflate-raw'));
  return dec.decode(await streamToBytes(stream));
}
