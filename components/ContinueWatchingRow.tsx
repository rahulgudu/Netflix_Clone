"use client";

import React from "react";
import { useRouter } from "next/router";
import { BsFillPlayFill, BsXCircleFill } from "react-icons/bs";
import { FaClock } from "react-icons/fa";
import axios from "axios";

interface WatchProgressItem {
  id: string;
  contentType: "movie" | "episode";
  movieId?: string;
  seriesId?: string;
  episodeId?: string;
  title?: string;
  thumbnailUrl?: string;
  episodeLabel?: string;
  currentTime: number;
  duration: number;
  percentage: number;
}

interface ContinueWatchingRowProps {
  data: WatchProgressItem[];
  onRemove: () => void; // callback to refetch after removal
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return `${h}h ${rem}m left`;
  }
  return `${m}m ${s}s left`;
};

const ContinueWatchingRow: React.FC<ContinueWatchingRowProps> = ({ data, onRemove }) => {
  const router = useRouter();

  if (!data || data.length === 0) return null;

  const handlePlay = (item: WatchProgressItem) => {
    if (item.contentType === "movie" && item.movieId) {
      router.push(`/watch/${item.movieId}`);
    } else if (item.contentType === "episode" && item.seriesId) {
      router.push(`/series/${item.seriesId}`);
    }
  };

  const handleRemove = async (e: React.MouseEvent, item: WatchProgressItem) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/watch-progress?id=${item.id}`);
      onRemove();
    } catch {}
  };

  const timeRemaining = (item: WatchProgressItem) => {
    const remaining = item.duration - item.currentTime;
    if (remaining <= 0 || !item.duration) return null;
    return formatTime(remaining);
  };

  return (
    <div className="px-4 md:px-12 mt-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <FaClock className="text-red-500" size={18} />
        <h2 className="text-white text-lg md:text-2xl font-semibold">Continue Watching</h2>
      </div>

      {/* Horizontal Scroll Row */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {data.map((item) => {
          const remaining = timeRemaining(item);
          return (
            <div
              key={item.id}
              onClick={() => handlePlay(item)}
              className="group relative flex-shrink-0 w-[200px] sm:w-[240px] cursor-pointer rounded-lg overflow-hidden bg-zinc-900 hover:scale-105 transition-transform duration-300"
            >
              {/* Thumbnail */}
              <div className="relative w-full aspect-video bg-zinc-800">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                    <BsFillPlayFill size={40} className="text-zinc-500" />
                  </div>
                )}

                {/* Play overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                    <BsFillPlayFill size={22} className="text-black ml-0.5" />
                  </div>
                </div>

                {/* Remove (×) button */}
                <button
                  onClick={(e) => handleRemove(e, item)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-white hover:text-red-400"
                  title="Remove from Continue Watching"
                >
                  <BsXCircleFill size={20} />
                </button>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 w-full h-[4px] bg-zinc-600">
                  <div
                    className="h-full bg-red-600 transition-all"
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-white text-sm font-semibold line-clamp-1">{item.title}</p>
                {item.episodeLabel && (
                  <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{item.episodeLabel}</p>
                )}
                {remaining && (
                  <p className="text-zinc-500 text-xs mt-1">{remaining}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContinueWatchingRow;
