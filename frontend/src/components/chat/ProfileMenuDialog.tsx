import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { X, ShieldCheck, KeyRound, ChevronRight, Camera, Image as ImageIcon, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { uploadAvatar } from "@/services/apis/auth";
import ImageCropModal from "../ui/ImageCropModal";
import { ChangeNameDialog } from "../ui/ChangeNameDialog";
import { useTranslation } from "react-i18next";
type Props = {
  open: boolean;
  onClose: () => void;
  onSignOut?: () => void;
  onChangePassword?: () => void;
  anchorRef: React.RefObject<HTMLElement>;
  userInfo?: any;
  onAvatarChange?: (newUrl: string) => void;
};
const BASE_URL = import.meta.env.VITE_API_BACKEND_DOMAIN || "";
export const ProfileMenuDialog: React.FC<Props> = ({
  open,
  onClose,
  onSignOut,
  onChangePassword,
  anchorRef,
  userInfo,
  onAvatarChange,
}) => {
  const { t } = useTranslation();
  const GAP = 10;
  const EDGE = 12;
  const PANEL_W = 320;
  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [pos, setPos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  useLayoutEffect(() => {
    if (!open) return;
    const compute = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      const r = anchor.getBoundingClientRect();
      const ph = Math.max(200, panel.getBoundingClientRect().height || 0);
      const pw = PANEL_W;
      let left = r.right - pw;
      let top = r.bottom + GAP;
      const spaceBelow = window.innerHeight - r.bottom;
      const spaceAbove = r.top;
      if (spaceBelow < ph + GAP && spaceAbove > spaceBelow) {
        top = r.top - ph - GAP;
      }
      left = Math.max(EDGE, Math.min(left, window.innerWidth - pw - EDGE));
      top = Math.max(EDGE, Math.min(top, window.innerHeight - ph - EDGE));
      setPos({ left, top });
    };
    compute();
    const raf = requestAnimationFrame(compute);
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open, anchorRef]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setSelectedImage(reader.result as string);
      setCropModalOpen(true);
    });
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropModalOpen(false);
    setSelectedImage(null);
    setUploading(true);
    try {
      const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
      const { avatar_url } = await uploadAvatar(file);
      onAvatarChange?.(avatar_url);
      toast.success(t('common.profile.uploadSuccess'));
    } catch (err: any) {
      const msg = err.message || t('common.profile.uploadError');
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };
  const avatarSrc = userInfo?.avatar_url ? `${BASE_URL}${userInfo.avatar_url}` : null;
  const initials = (userInfo?.full_name || "U").charAt(0).toUpperCase();
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <button
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close"
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed w-[320px] rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 overflow-hidden shadow-2xl"
        style={
          pos ? { left: pos.left, top: pos.top } : { right: EDGE, top: 72 } 
        }
      >
        <div className="p-6">
          {/* Top row: close */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              aria-label="Close"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Profile */}
          <div className="-mt-2 flex flex-col items-center text-center">
            <div className="relative group">
              {/* Avatar */}
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={userInfo?.full_name || "User"}
                  className="w-[84px] h-[84px] rounded-full object-cover ring-4 ring-white shadow-md"
                />
              ) : (
                <div className="w-[84px] h-[84px] rounded-full ring-4 ring-white shadow-md bg-primary/10 flex items-center justify-center text-primary font-extrabold text-3xl">
                  {initials}
                </div>
              )}
              {/* Camera overlay — click to upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Đổi ảnh đại diện"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-extrabold tracking-wide rounded-full bg-primary text-white shadow">
                {uploading ? "..." : "PREMIUM"}
              </span>
            </div>
            {uploadError && (
              <p className="mt-3 text-xs text-red-500">{uploadError}</p>
            )}
            <div className="mt-4">
              <div className="text-[18px] font-extrabold text-slate-900 dark:text-white leading-tight">
                {userInfo?.full_name || "Guest User"}
              </div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {userInfo?.email || "guest@example.com"}
              </div>
            </div>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary">
              <ShieldCheck className="w-4 h-4" />
              ID: {userInfo?.id || "N/A"}
            </div>
          </div>
          <div className="my-5 h-px bg-slate-100 dark:bg-slate-800" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-between rounded-2xl px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-slate-800 dark:text-white">
                {t('common.profile.changeAvatar')}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
          </button>
          <button
            onClick={() => {
              setNameModalOpen(true);
            }}
            className="mt-2 w-full flex items-center justify-between rounded-2xl px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <UserCircle className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-slate-800 dark:text-white">
                {t('common.profile.changeName')}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
          </button>
          <button
            onClick={() => {
              onChangePassword?.();
              onClose();
            }}
            className="mt-2 w-full flex items-center justify-between rounded-2xl px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="text-sm font-semibold text-slate-800 dark:text-white">
                {t('common.profile.changePassword')}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
          </button>
          <button
            onClick={onSignOut}
            className="mt-4 w-full rounded-2xl py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-extrabold hover:bg-red-100 dark:hover:bg-red-900/30 active:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            {t('common.profile.logout')}
          </button>
        </div>
      </div>
      {selectedImage && (
        <ImageCropModal
          open={cropModalOpen}
          imageSrc={selectedImage}
          onClose={() => {
            setCropModalOpen(false);
            setSelectedImage(null);
          }}
          onCropCompleteAction={handleCropComplete}
        />
      )}
      {nameModalOpen && (
        <ChangeNameDialog
          open={nameModalOpen}
          onClose={() => setNameModalOpen(false)}
          currentName={userInfo?.full_name}
        />
      )}
    </div>,
    document.body,
  );
};
