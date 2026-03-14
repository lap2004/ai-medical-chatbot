import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import ModalShell from "./ModalShell";
import { Button } from "./Button";
import { useTranslation } from "react-i18next";

export default function ImageCropModal({
    open,
    imageSrc,
    onClose,
    onCropCompleteAction,
}: {
    open: boolean;
    imageSrc: string;
    onClose: () => void;
    onCropCompleteAction: (croppedBlob: Blob) => void;
}) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            if (!croppedAreaPixels) return;
            setLoading(true);
            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
            if (croppedImageBlob) {
                onCropCompleteAction(croppedImageBlob);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalShell
            open={open}
            title={t('common.profile.cropPhoto', 'Cắt ảnh')}
            subtitle={t('common.profile.cropPhotoDesc', 'Chỉnh ảnh trước khi tải lên')}
            onClose={onClose}
        >
            <div className="relative w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden my-4">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1} // Hình vuông
                    cropShape="round"
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                />
            </div>

            <div className="flex items-center gap-4 mb-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Zoom</span>
                <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => {
                        setZoom(Number(e.target.value));
                    }}
                    className="w-full form-range appearance-none bg-slate-200 dark:bg-slate-700 rounded-full h-1"
                />
            </div>

            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose} disabled={loading}>
                    {t('common.cancel', 'Hủy')}
                </Button>
                <Button variant="secondary" onClick={handleSave} disabled={loading}>
                    {loading ? t('common.profile.saving', 'Đang lưu...') : t('common.profile.saveAvatar', 'Lưu ảnh')}
                </Button>
            </div>
        </ModalShell>
    );
}
