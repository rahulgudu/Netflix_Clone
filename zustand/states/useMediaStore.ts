// zustand/states/useSelectStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type MediaEntity = {
  videoId: string;
  thumbnailUrl: string;
  trailerId: string;
};

type MediaStore = {
  videoId: MediaEntity | null;
  thumbnailUrl: MediaEntity | null;
  trailerId: MediaEntity | null;
  setVideoId: (videoId: MediaEntity) => void;
  setThumbnailUrl: (thumbnailUrl: MediaEntity) => void;
  setTrailerId: (trailerId: MediaEntity) => void;
  clearMedia: () => void;
};

export const useMediaStore = create<MediaStore>()(
  persist(
    (set) => ({
      videoId: null,
      thumbnailUrl: null,
      trailerId: null,

      setVideoId: (videoId) => set({ videoId }),
      setThumbnailUrl: (thumbnailUrl) => set({ thumbnailUrl }),
      setTrailerId: (trailerId) => set({ trailerId }),
      clearMedia: () =>
        set({ videoId: null, thumbnailUrl: null, trailerId: null }),
    }),
    {
      name: "active-media",
    },
  ),
);
