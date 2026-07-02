"use client";

import useSeriesBillboard from "@/hooks/useSeriesBillboard";
import React, { useState } from "react";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { useRouter } from "next/router";
import { BsFillPlayFill } from "react-icons/bs";

import "@vidstack/react/player/styles/base.css";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import Loader from "./Loader";
import NoData from "./NoData";

const SeriesBillboard = () => {
  const router = useRouter();
  const { data, isLoading } = useSeriesBillboard();
  const [isLoaded, setIsLoaded] = useState(false);

  if (!data && !isLoading) {
    return (
      <NoData
        title="No series found"
        description="Our team is working on bringing series content soon."
      />
    );
  }

  if (isLoading) {
    return <Loader />;
  }

  const handleAction = () => {
    if (data?.id) {
      router.push(`/series/${data.id}`);
    }
  };

  const seasonCount = data?.seasons?.length ?? 0;

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
        <div className="flex items-center gap-2">
          <span className="bg-zinc-800/80 text-white text-[10px] md:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-white/10">
            Series
          </span>
          {seasonCount > 0 && (
            <span className="text-gray-300 text-xs md:text-sm">
              {seasonCount} {seasonCount === 1 ? "Season" : "Seasons"}
            </span>
          )}
        </div>

        <h1 className="text-white text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold drop-shadow-xl">
          {data?.title}
        </h1>

        <p className="hidden sm:block text-white text-sm md:text-lg drop-shadow-xl line-clamp-3">
          {data?.description}
        </p>

        <div className="flex items-center gap-3 mt-2">
          {/* Play Button */}
          <button
            onClick={handleAction}
            className="bg-white rounded-md py-1.5 md:py-2 px-3 md:px-5 text-black text-xs lg:text-lg font-semibold flex flex-row items-center hover:bg-neutral-300 transition"
          >
            <BsFillPlayFill size={25} className="mr-1" />
            Play
          </button>

          {/* More Info Button */}
          <button
            onClick={handleAction}
            className="flex items-center gap-2 bg-white/30 text-white px-4 py-2 rounded-md text-sm md:text-lg font-semibold hover:bg-white/20 transition"
          >
            <AiOutlineInfoCircle size={20} />
            <span>More Info</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeriesBillboard;
