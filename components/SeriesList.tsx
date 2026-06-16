"use client";

import React from "react";
import { isEmpty } from "lodash";
import { useRouter } from "next/router";
import SeriesCard from "./SeriesCard";

interface SeriesListProps {
  data: Record<string, any>[];
  title: string;
}

const SeriesList: React.FC<SeriesListProps> = ({ data, title }) => {
  const router = useRouter();
  if (isEmpty(data)) return null;

  return (
    <div className="px-4 md:px-12 mt-8">
      <h2 className="text-white text-lg md:text-2xl font-semibold mb-4">{title}</h2>
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
        "
      >
        {data.map((series) => (
          <div
            key={series.id}
            onClick={() => router.push(`/series/${series.id}`)}
            className="
              min-w-[160px]
              sm:min-w-[180px]
              md:min-w-0
              md:w-full
              transition-transform
              duration-300
              hover:scale-105
            "
          >
            <SeriesCard data={series} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeriesList;
