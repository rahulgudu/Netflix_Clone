import useModelInfo from "@/hooks/useModelInfo";
import useMovie from "@/hooks/useMovie";
import React, { useCallback, useEffect, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import PlayBtn from "./PlayBtn";
import FavouriteBtn from "./FavouriteBtn";

interface InfoModelProps {
  visible?: boolean;
  onClose: () => void;
}

const InfoModel = ({ visible, onClose }: InfoModelProps) => {
  const [isVisible, setIsVisible] = useState(!!visible);

  const { movieId } = useModelInfo();
  const { data = {} } = useMovie(movieId || "");

  useEffect(() => {
    setIsVisible(!!visible);
  }, [visible]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-4xl mx-4 overflow-hidden rounded-xl bg-zinc-900 shadow-2xl transform transition-all duration-300 scale-100">
        
        {/* Video Section */}
        <div className="relative h-[22rem]">
          <video
            className="h-full w-full object-cover brightness-75"
            src={data?.videoUrl}
            autoPlay
            muted
            loop
            poster={data?.thumbnailUrl}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 hover:bg-black transition"
          >
            <AiOutlineClose className="text-white" size={20} />
          </button>

          {/* Title & Actions */}
          <div className="absolute bottom-6 left-6 space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
              {data?.title}
            </h1>

            <div className="flex items-center gap-4">
              <PlayBtn movieId={data?.id} />
              <FavouriteBtn movieId={data?.id} />
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="px-6 md:px-10 py-8 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-400 font-semibold">New</span>
            <span className="text-white">{data?.duration}</span>
            <span className="text-white border border-white/30 px-2 py-[1px] rounded">
              {data?.genre}
            </span>
          </div>

          <p className="text-white/90 text-base leading-relaxed max-w-3xl">
            {data?.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InfoModel;
