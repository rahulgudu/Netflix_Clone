"use client";

import React from "react";
import { isEmpty } from "lodash";
import MovieCard from "./MovieCard";
import { useRouter } from "next/router";

interface MovieListProps {
  data: Record<string, any>[];
  title: string;
}

const MovieList: React.FC<MovieListProps> = ({ data, title }) => {
  if (isEmpty(data)) return null;
  const router = useRouter();

  return (
    <div className="px-4 md:px-12 mt-8">
      <h2 className="text-white text-lg md:text-2xl font-semibold mb-4">
        {title}
      </h2>

      {/* 📱 Mobile: Horizontal Scroll | 🖥 Desktop: Grid */}
      <div
        className="
          flex 
          gap-3 
          overflow-x-auto 
          scrollbar-hide
          md:grid 
          md:grid-cols-4 
          lg:grid-cols-5
          md:gap-4 
          md:overflow-visible
        ">
        {data.map((movie) => (
          <div
            key={movie.id}
            onClick={() => router.push(`/watch/${movie.id}`)}
            className="
              min-w-[160px]
              sm:min-w-[180px]
              md:min-w-0
              md:w-full
              transition-transform
              duration-300
              hover:scale-105
            ">
            <MovieCard data={movie} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieList;
