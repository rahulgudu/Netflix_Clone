// zustand/states/useSelectStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type SelectedEntity = {
  id: string;
  name: string;
  image?: string;
};

type SelectionStore = {
  user: SelectedEntity | null;
  profile: SelectedEntity | null;
  setUser: (user: SelectedEntity) => void;
  setProfile: (profile: SelectedEntity) => void;
  clear: () => void;
};

export const useSelectionStore = create<SelectionStore>()(
  persist(
    (set) => ({
      user: null,
      profile: null,

      setUser: (user) =>
        set({
          user,
          profile: null,
        }),

      setProfile: (profile) =>
        set({
          profile,
          user: null,
        }),

      clear: () => set({ user: null, profile: null }),
    }),
    {
      name: "active-selection", // key in localStorage
    }
  )
);