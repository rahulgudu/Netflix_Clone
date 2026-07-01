import { create } from "zustand";
import { persist } from "zustand/middleware";

type VideoEntity = {
    id: string;
};

type VideoStore = {
    videoId: VideoEntity | null;
    setVideoId: (videoId: VideoEntity) => void;
    clearVideoId: () => void;
};

export const useVideoStore = create<VideoStore>()(
    persist(
        (set) => ({
            videoId: null,

            setVideoId: (videoId) => set({ videoId }),

            clearVideoId: () => set({ videoId: null }),
        }),
        {
            name: "video-storage",
        }
    )
);