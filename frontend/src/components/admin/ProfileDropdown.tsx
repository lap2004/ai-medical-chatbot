import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, LogOut, KeyRound, Shield, Camera, Image as ImageIcon, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { uploadAvatar } from "@/services/apis/auth";
import ImageCropModal from "../ui/ImageCropModal";
import { ChangeNameDialog } from "../ui/ChangeNameDialog";
export default function ProfileDropdown({
  onLogout,
  userInfo,
  onChangePassword,
  onAvatarChange,
}: {
  onLogout: () => void;
  userInfo?: any;
  onChangePassword: () => void;
  onAvatarChange?: (newUrl: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (document.getElementById("crop-modal-root") || cropModalOpen || nameModalOpen) return;
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [cropModalOpen]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      toast.success("Thay đổi ảnh đại diện thành công!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Đổi ảnh đại diện quá dung lượng hoặc sai định dạng!");
    } finally {
      setUploading(false);
    }
  };
  const BASE_URL = import.meta.env.VITE_API_BACKEND_DOMAIN || "";
  const avatarSrc = userInfo?.avatar_url ? `${BASE_URL}${userInfo.avatar_url}` : null;
  const initials = (userInfo?.full_name || "A").charAt(0).toUpperCase();
  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {avatarSrc ? (
          <img src={avatarSrc} alt="Avatar" className="w-7 h-7 rounded-full object-cover shadow-sm bg-slate-200" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-[10px]">
            {initials}
          </div>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 mt-3 w-[320px] rounded-[28px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 shadow-2xl p-5 z-50">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex flex-col items-center pt-3">
            <div className="relative group">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="w-16 h-16 rounded-full object-cover bg-slate-200" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-2xl">
                  {initials}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Đổi ảnh đại diện"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-extrabold bg-teal-600 text-white z-10 whitespace-nowrap">
                {uploading ? "..." : (userInfo?.role || "ADMIN")}
              </div>
            </div>
            <div className="mt-4 text-[18px] font-black text-slate-900 dark:text-white">
              {userInfo?.full_name || "Guest User"}
            </div>
            <div className="text-[12px] text-slate-400 dark:text-slate-500 -mt-0.5">
              {userInfo?.email || "guest@example.com"}
            </div>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-800">
              <Shield className="w-4 h-4" />
              <span className="text-[11px] font-extrabold">
                ID: {userInfo?.id || "N/A"}
              </span>
            </div>
          </div>
          <div className="my-4 border-t border-slate-100 dark:border-slate-800" />
          <button
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="text-[13px] font-extrabold text-slate-700 dark:text-white">
                Change Avatar
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-300 dark:text-slate-600 -rotate-90" />
          </button>
          <button
            className="w-full flex items-center justify-between px-4 py-3 mt-1 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setNameModalOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="text-[13px] font-extrabold text-slate-700 dark:text-white">
                Change Name
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-300 dark:text-slate-600 -rotate-90" />
          </button>
          <button
            className="w-full flex items-center justify-between px-4 py-3 mt-1 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            onClick={() => {
              setOpen(false);
              onChangePassword();
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="text-[13px] font-extrabold text-slate-700 dark:text-white">
                Change Password
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-300 dark:text-slate-600 -rotate-90" />
          </button>
          <button
            className="mt-4 w-full h-11 rounded-2xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-extrabold text-[13px] flex items-center justify-center gap-2 transition-colors"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <LogOut className="w-4 h-4" />
            Back to Home Page
          </button>
        </div>
      )}
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
    </div>
  );
}
