import { create } from "zustand";
import { persist } from "zustand/middleware";

type MovieEntity = {
    title: string;
    description: string;
    videoId: string;
    thumbnailUrl: string;
    trailerId: string;
    genre: string;
    duration: string;
    regionId: string
};

type MovieStore = {
    movie: MovieEntity | null;
    setMovie: (movie: MovieEntity) => void;
    clearMovie: () => void;
};

export const useMovieStore = create<MovieStore>()(
    persist(
        (set) => ({
            movie: null,
            setMovie: (movie) => set({ movie }),
            clearMovie: () => set({ movie: null }),
        }),
        {
            name: "movie-storage",
        }
    )
);