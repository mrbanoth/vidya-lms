import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { assetUrl } from "@/lib/api";

const youtubeId = (url = "") =>
  url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)?.[1];

/**
 * Plays an uploaded/hosted MP4 with native controls, or a YouTube link via embed.
 * Reports position so the server can resume where the learner stopped.
 */
const VideoPlayer = forwardRef(function VideoPlayer({ url, startAt = 0, onProgress, onEnded, title }, ref) {
  const video = useRef(null);
  const lastSent = useRef(0);
  useImperativeHandle(ref, () => ({ currentTime: () => video.current?.currentTime || 0 }));

  useEffect(() => {
    const v = video.current;
    if (v && startAt > 3) {
      const set = () => (v.currentTime = Math.min(startAt, (v.duration || startAt + 1) - 1));
      if (v.readyState >= 1) set();
      else v.addEventListener("loadedmetadata", set, { once: true });
    }
    lastSent.current = startAt;
  }, [url, startAt]);

  const yt = youtubeId(url);
  if (yt)
    return (
      <div className="aspect-video w-full max-w-full bg-black">
        <iframe
          className="size-full"
          src={`https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1&start=${Math.floor(startAt)}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );

  if (!url)
    return (
      <div className="grid aspect-video w-full place-items-center bg-slate-900 text-sm text-white/70">
        Video is being prepared.
      </div>
    );

  return (
    <video
      ref={video}
      key={url}
      src={assetUrl(url)}
      controls
      playsInline
      preload="metadata"
      className="aspect-video w-full max-w-full bg-black"
      controlsList="nodownload"
      onTimeUpdate={(e) => {
        const t = e.currentTarget.currentTime;
        if (Math.abs(t - lastSent.current) >= 15) {
          lastSent.current = t;
          onProgress?.(t);
        }
      }}
      onPause={(e) => onProgress?.(e.currentTarget.currentTime)}
      onEnded={onEnded}
    >
      <track kind="captions" />
    </video>
  );
});

export default VideoPlayer;
