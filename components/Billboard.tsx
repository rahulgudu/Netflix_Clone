"use client";

import useBillboard from "@/hooks/useBillbord";
import React, { useCallback, useState } from "react";
import { AiOutlineInfoCircle } from "react-icons/ai";
import PlayBtn from "./PlayBtn";
import useModelInfo from "@/hooks/useModelInfo";

import "@vidstack/react/player/styles/base.css";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import NoData from "./NoData";
import Loader from "./Loader";

const Billboard = () => {
  const { data, isLoading } = useBillboard();
  const { openModel } = useModelInfo();

  const [isLoaded, setIsLoaded] = useState(false);

  const handleOpenModal = useCallback(() => {
    if (data?.id) openModel(data.id);
  }, [openModel, data?.id]);

  if (!data && !isLoading) {
    return (
      <>
        <NoData
          title="No movies found"
          description="Our Team is working on it"
        />
      </>
    );
  }
  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="relative w-full h-[70vh] md:h-[56.25vw] overflow-hidden">
      {/* 🖼 Thumbnail (shown until video loads) */}
      {!isLoaded && (
        <img
          src={data?.thumbnailUrl || ""}
          alt="thumbnail"
          className="absolute inset-0 w-full h-full object-cover brightness-[60%]"
        />
      )}

      {/* 🎬 Video */}
      {data?.trailerUrl && (
        <MediaPlayer
          src={data.trailerUrl}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full"
          onCanPlay={() => setIsLoaded(true)} // ✅ when video is ready
        >
          <MediaProvider
            className={`w-full h-full object-cover brightness-[60%] transition-opacity duration-700 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </MediaPlayer>
      )}

      {/* 🎨 Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent" />

      {/* 📄 Content */}
      <div className="absolute bottom-8 md:bottom-[25%] left-4 md:left-16 right-4 md:right-auto max-w-xl space-y-4">
        <h1 className="text-white text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold drop-shadow-xl">
          {data?.title}
        </h1>

        <p className="hidden sm:block text-white text-sm md:text-lg drop-shadow-xl line-clamp-3">
          {data?.description}
        </p>

        <div className="flex items-center gap-3 mt-2">
          <PlayBtn movieId={data?.id} />

          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-white/30 text-white px-4 py-2 rounded-md text-sm md:text-lg font-semibold hover:bg-white/20 transition">
            <AiOutlineInfoCircle size={20} />
            <span className="hidden sm:inline">More Info</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Billboard;
