import { create } from "zustand";

export interface ModelInfo {
  movieId?: string;
  isOpen: boolean;
  openModel: (movieId: string) => void;
  closeModel: () => void;
}
const useModelInfo = create<ModelInfo>((set) => ({
  movieId: undefined,
  isOpen: false,
  openModel: (movieId: string) => set({ isOpen: true, movieId }),
  closeModel: () => set({ isOpen: false, movieId: undefined }),
}));

export default useModelInfo;
