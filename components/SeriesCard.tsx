import React from "react";
import { BsFillPlayFill } from "react-icons/bs";
import { BiChevronDown } from "react-icons/bi";
import { useRouter } from "next/router";

interface SeriesCardProps {
  data: Record<string, any>;
}

const isNewlyAdded = (dateStr?: string) => {
  if (!dateStr) return false;
  return (Date.now() - new Date(dateStr).getTime()) / 86400000 <= 7;
};

const formatNote = (note?: string) => {
  if (!note) return "";
  return note
    .replace(/New episodes added to Season\s*(\d+)/i, "New Eps • S$1")
    .replace(/New episode added to Season\s*(\d+)/i, "New Ep • S$1")
    .replace(/Episodes added to Season\s*(\d+)/i, "Eps • S$1")
    .replace(/Episode added to Season\s*(\d+)/i, "Ep • S$1")
    .replace(/Season\s*(\d+)\s*added/i, "S$1 Added")
    .replace(/Season\s*(\d+)\s*removed/i, "S$1 Removed")
    .replace(/New episodes added/i, "New Eps")
    .replace(/New episode added/i, "New Ep")
    .replace(/Episodes added/i, "Eps")
    .replace(/Episode added/i, "Ep");
};

const SeriesCard: React.FC<SeriesCardProps> = ({ data }) => {
  const router = useRouter();
  const seasonCount = data.seasons?.length ?? 0;

  return (
    <div className="group bg-zinc-900 col-span relative h-24 md:h-[12vw]">
      {/* Badges */}
      <div className="absolute top-2 left-2 z-20 flex flex-wrap gap-1.5 max-w-[90%]">
        {isNewlyAdded(data.createdAt) && (
          <span className="bg-red-600 text-[9px] sm:text-[10px] font-bold uppercase px-1.5 py-0.5 rounded whitespace-nowrap">
            New
          </span>
        )}
        {data.lastModifiedNote && !isNewlyAdded(data.createdAt) && (
          <span 
            className="bg-blue-600 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] inline-block"
            title={data.lastModifiedNote}
          >
            {formatNote(data.lastModifiedNote)}
          </span>
        )}
      </div>
      <img
        className="cursor-pointer object-cover transition duration shadow-xl rounded-md group-hover:opacity-90 sm:group-hover:opacity-0 delay-300 w-full h-24 md:h-[12vw]"
        src={data.thumbnailUrl || "/placeholder.jpg"}
        alt={data.title}
      />
      <div className="opacity-0 absolute top-0 transition duration-200 z-10 invisible sm:visible w-full scale-0 group-hover:scale-110 group-hover:-translate-y-[6vw] group-hover:translate-x-[2vw] group-hover:opacity-100">
        <img
          className="cursor-pointer object-cover transition duration shadow-xl rounded-t-md w-full h-24 md:h-[12vw]"
          src={data.thumbnailUrl || "/placeholder.jpg"}
          alt={data.title}
        />
        <div className="z-10 bg-zinc-800 p-2 lg:p-4 absolute w-full transition shadow-md rounded-b-md">
          <div className="flex flex-row items-center gap-3">
            <div
              onClick={() => router.push(`/series/${data.id}`)}
              className="cursor-pointer w-6 h-6 lg:w-10 lg:h-10 bg-white rounded-full flex justify-center items-center transition hover:bg-neutral-300"
            >
              <BsFillPlayFill size={30} />
            </div>
            <div
              onClick={() => router.push(`/series/${data.id}`)}
              className="cursor-pointer ml-auto group/item w-6 h-6 lg:w-10 lg:h-10 border-white border-2 rounded-full flex justify-center items-center transition hover:border-neutral-300"
            >
              <BiChevronDown className="text-white" size={30} />
            </div>
          </div>

          <p className="text-green-400 font-semibold mt-4">Series</p>

          <div className="flex flex-row mt-4 gap-2 items-center">
            <p className="text-white text-[10px] lg:text-sm">
              {seasonCount} {seasonCount === 1 ? "Season" : "Seasons"}
            </p>
          </div>

          <div className="flex flex-row mt-4 gap-2 items-center">
            <p className="text-white text-[10px] lg:text-sm">{data.genre}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeriesCard;
