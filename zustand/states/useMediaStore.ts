// zustand/states/useSelectStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type MediaEntity = {
    videoId: string;
    thumbnailUrl: string;
};

type MediaStore = {
    videoId: MediaEntity | null;
    thumbnailUrl: MediaEntity | null;
    setVideoId: (videoId: MediaEntity) => void;
    setThumbnailUrl: (thumbnailUrl: MediaEntity) => void;
    clearMedia: () => void;
};

export const useMediaStore = create<MediaStore>()(
    persist(
        (set) => ({
            videoId: null,
            thumbnailUrl: null,

            setVideoId: (videoId) => set({ videoId }),
            setThumbnailUrl: (thumbnailUrl) => set({ thumbnailUrl }),
            clearMedia: () => set({ videoId: null, thumbnailUrl: null })
        }),
        {
            name: "active-media",
        }
    )
);