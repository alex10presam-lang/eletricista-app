import { Capacitor } from '@capacitor/core';

export async function shareFile(blob: Blob, filename: string, title: string) {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const buffer = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < buffer.length; offset += 8192) {
      binary += String.fromCharCode(...buffer.subarray(offset, offset + 8192));
    }
    const file = await Filesystem.writeFile({
      directory: Directory.Cache,
      path: `exports/${filename}`,
      data: btoa(binary),
      recursive: true,
    });
    await Share.share({ title, files: [file.uri], dialogTitle: title });
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
