import { create } from "zustand";

type AuthUIState = {
  forcePasswordChange: boolean;
  setForcePasswordChange: (v: boolean) => void;
  reset: () => void;
};

export const useAuthUIStore = create<AuthUIState>((set) => ({
  forcePasswordChange: false,
  setForcePasswordChange: (v) => set({ forcePasswordChange: v }),
  reset: () => set({ forcePasswordChange: false }),
}));
