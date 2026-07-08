interface BunnyPlayerProps {
  videoId: string;
}

export default function BunnyPlayer({
  videoId,
}: BunnyPlayerProps) {

  return (

    <div className="aspect-video rounded-xl border bg-gray-100 flex items-center justify-center">

      <div className="text-center">

        <p className="font-semibold">
          Bunny Stream
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Video ID:
        </p>

        <p className="font-mono text-sm">
          {videoId}
        </p>

      </div>

    </div>

  );

}