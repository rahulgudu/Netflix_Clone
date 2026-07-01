import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SeriesEpisode {
  number: number;
  title: string;
  videoId: string;
  duration: string;
}

export interface SeriesSeason {
  number: number;
  episodes: SeriesEpisode[];
}

export interface SeriesFormData {
  title: string;
  description: string;
  genre: string;
  regionId: string;
  trailerId: string;
  thumbnailUrl: string;
  seasons: SeriesSeason[];
}

interface SeriesStore {
  seriesData: SeriesFormData | null;
  isSubmitting: boolean;
  isPublishing: boolean;
  setSeriesData: (data: SeriesFormData) => void;
  setSubmitting: (val: boolean) => void;
  setPublishing: (val: boolean) => void;
  reset: () => void;
}

export const useSeriesStore = create<SeriesStore>()(
  persist(
    (set) => ({
      seriesData: null,
      isSubmitting: false,
      isPublishing: false,
      setSeriesData: (data) => set({ seriesData: data }),
      setSubmitting: (val) => set({ isSubmitting: val }),
      setPublishing: (val) => set({ isPublishing: val }),
      reset: () => set({ seriesData: null, isSubmitting: false, isPublishing: false }),
    }),
    {
      name: 'series-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
