import { create } from "zustand";
import { isLogin } from "@/lib/helper";
import { userMe } from "@/services/apis/auth";
type UserStoreState = {
    userInfo: any | null;
    loading: boolean;
    fetchUserInfo: () => Promise<void>;
    setUserInfo: (info: any) => void;
    updateAvatarUrl: (newUrl: string) => void;
    updateFullName: (newName: string) => void;
};
export const useUserStore = create<UserStoreState>((set, get) => ({
    userInfo: null,
    loading: false,
    fetchUserInfo: async () => {
        if (!isLogin()) return;
        set({ loading: true });
        try {
            const { data } = await userMe({});
            if (data) {
                set({ userInfo: data });
            }
        } catch (err) {
            console.error("fetchUserInfo error", err);
        } finally {
            set({ loading: false });
        }
    },
    setUserInfo: (info: any) => set({ userInfo: info }),
    updateAvatarUrl: (newUrl: string) => {
        const { userInfo } = get();
        if (userInfo) {
            const urlObj = new URL(newUrl, window.location.origin);
            urlObj.searchParams.set("t", Date.now().toString());
            const finalUrl = urlObj.pathname + urlObj.search;
            set({ userInfo: { ...userInfo, avatar_url: finalUrl } });
        }
    },
    updateFullName: (newName: string) => {
        const { userInfo } = get();
        if (userInfo) {
            set({ userInfo: { ...userInfo, full_name: newName } });
        }
    },
}));
