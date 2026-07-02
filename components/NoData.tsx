import React from "react";
import { Film } from "lucide-react"; // Optional: Use an icon library like Lucide

const NoData = ({
  title = "No results found",
  description = "Try adjusting your filters or search terms.",
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[400px] p-8 text-center bg-transparent">
      {/* Icon Container */}
      <div className="flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-zinc-800/50">
        <Film className="w-10 h-10 text-zinc-500" />
      </div>

      {/* Text Content */}
      <h3 className="text-2xl font-semibold text-white mb-2">{title}</h3>
      <p className="max-w-xs text-zinc-400 text-base mb-8">{description}</p>

      {/* Optional Action Button (like "Go Home" or "Clear Search") */}
      {actionLabel && (
        <button
          onClick={onAction}
          className="px-6 py-2 font-medium text-black bg-white rounded hover:bg-zinc-200 transition-colors">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default NoData;
