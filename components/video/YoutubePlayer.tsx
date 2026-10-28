import VideoFullscreenFrame from "./VideoFullscreenFrame";

interface YoutubePlayerProps {
  videoId: string;
}

export default function YoutubePlayer({
  videoId,
}: YoutubePlayerProps) {

  return (

    <VideoFullscreenFrame>

      <iframe
        className="h-full w-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />

    </VideoFullscreenFrame>

  );

}
