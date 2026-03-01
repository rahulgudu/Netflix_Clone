"use client";

import useMovie from "@/hooks/useMovie";
import { useRouter } from "next/router";
import "@vidstack/react/player/styles/base.css";
import "@vidstack/react/player/styles/plyr/theme.css";

import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  PlyrLayout,
  plyrLayoutIcons,
} from "@vidstack/react/player/layouts/plyr";

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
    <div className="min-h-screen w-full bg-black text-white">
      {/* 🔙 Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex items-center gap-3 px-4 md:px-8 py-4 bg-gradient-to-b from-black/80 to-transparent">
        <AiOutlineArrowLeft
          onClick={() => router.back()}
          className="cursor-pointer hover:opacity-80 transition"
          size={28}
        />
        <p className="text-sm md:text-xl font-semibold truncate">
          {data.title}
        </p>
      </nav>

      {/* 🎬 Player Section */}
      <div className="pt-16">
        <div className="w-full aspect-video bg-black">
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
        </div>
      </div>

      {/* 🎞 Movie Info Section (Below Player on Mobile) */}
      <div className="px-4 md:px-12 py-6 md:py-12 space-y-4">
        <h1 className="text-xl md:text-4xl font-bold">
          {data.title}
        </h1>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-400">
          <span className="border px-2 py-1 uppercase text-[10px] md:text-xs">
            {data.genre}
          </span>
          <span>{data.duration}</span>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm md:text-lg leading-relaxed max-w-3xl">
          {data.description}
        </p>
      </div>
    </div>
  );
};

export default Movie;