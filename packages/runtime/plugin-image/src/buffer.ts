export function arrayBufferToHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}

export function inspectBuffer(buf: ArrayBuffer, length = 16) {
  const hex = arrayBufferToHex(buf.slice(0, length));
  return `${hex} +${buf.byteLength - length} bytes`;
}
