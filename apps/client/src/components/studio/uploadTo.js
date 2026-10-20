import { api } from "@/lib/api";

/** Adapter for Kokonut FileUpload: posts the file with real progress and abort support. */
export const uploadTo = (url, onDone) => async (file, { onProgress, signal }) => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await api.post(url, fd, {
    signal,
    timeout: 0,
    onUploadProgress: (e) => e.total && onProgress(Math.round((e.loaded / e.total) * 100)),
  });
  onDone?.(res.data.data);
};
