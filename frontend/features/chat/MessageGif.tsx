import { AutoplayMedia } from "@/components/ui/autoplay-media";
import { GifEmbed } from "@/types/message";

const MAX_WIDTH = 320;
const MAX_HEIGHT = 300;

/** A GIF message, sized like Discord's embeds and loaded from the provider's CDN. */
export function MessageGif({ gif }: { gif: GifEmbed }) {
  const scale = Math.min(1, MAX_WIDTH / gif.width, MAX_HEIGHT / gif.height);

  return (
    <div
      className="mt-1 max-w-full overflow-hidden rounded-lg bg-muted"
      style={{ width: Math.round(gif.width * scale), aspectRatio: `${gif.width} / ${gif.height}` }}
    >
      <AutoplayMedia
        src={gif.url}
        poster={gif.previewUrl}
        alt={gif.title || "GIF"}
        className="h-full w-full"
      />
    </div>
  );
}
