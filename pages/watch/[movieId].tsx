"use client";

import useMovie from "@/hooks/useMovie";
import { useRouter } from "next/router";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/plyr/theme.css";

import { MediaPlayer, MediaProvider } from "@vidstack/react";
import { PlyrLayout, plyrLayoutIcons } from "@vidstack/react/player/layouts/plyr";
import React from "react";
import { AiOutlineArrowLeft } from "react-icons/ai";

const Movie = () => {
  const router = useRouter();
  const { movieId } = router.query;

  const { data } = useMovie(movieId as string);

  if (!data?.videoUrl) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden">
      {/* 🔙 Top Navigation */}
      <nav className="fixed top-0 left-0 w-full p-6 z-50 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent">
        <AiOutlineArrowLeft
          onClick={() => router.back()}
          className="text-white cursor-pointer hover:opacity-80 transition"
          size={36}
        />
        <p className="text-white text-lg md:text-2xl font-semibold">
          {data.title}
        </p>
      </nav>

      {/* 🎬 Video Player */}
      <MediaPlayer
        title={data.title}
        src={data.videoUrl}
        className="h-full w-full"
      >
        <MediaProvider />
        <PlyrLayout
          thumbnails={data.thumbnailUrl}
          icons={plyrLayoutIcons}
        />
      </MediaPlayer>

      {/* 🎞 Bottom Overlay Info (Netflix Style) */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent p-8 md:p-16">
        <div className="max-w-4xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white">
            {data.title}
          </h1>

          {/* Metadata Row */}
          <div className="flex items-center gap-4 text-sm md:text-base text-gray-300">
            <span className="border px-2 py-1 text-xs uppercase">
              {data.genre}
            </span>
            <span>{data.duration}</span>
          </div>

          {/* Description */}
          <p className="text-gray-300 text-sm md:text-lg max-w-3xl leading-relaxed">
            {data.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Movie;