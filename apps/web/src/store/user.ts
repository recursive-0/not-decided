import { create } from "zustand";

interface UserDetails {
  email: string;
  name: string;
  googleId: string;
  picture: string;
}

interface UseUserStore {
  isAuthenticated: boolean;
  userDetails: UserDetails;
  setIsAuthenticated: (flag: boolean) => void;
  setUserDetails: (details: UserDetails) => void;
  clearUserDetails: () => void
}

export const useUserStore = create<UseUserStore>((set) => ({
  isAuthenticated: false,
  userDetails: {
    email: "",
    name: "",
    googleId: "",
    picture: "",
  },
  setIsAuthenticated: (flag) => set({ isAuthenticated: flag }),
  setUserDetails(details) {
    return set({ userDetails: details });
  },
  clearUserDetails() {
      return set({userDetails: {
        email: "",
        name: "",
        googleId: "",
        picture: ""
      }})
  },
}));
