import React, { useState } from "react";
import ModalShell from "./ModalShell";
import { Button } from "./Button";
import { toast } from "sonner";
import { updateProfile } from "@/services/apis/auth";
import { useUserStore } from "@/store/userStore";
import { useTranslation } from "react-i18next";

type Props = {
    open: boolean;
    onClose: () => void;
    currentName?: string;
};

export const ChangeNameDialog: React.FC<Props> = ({ open, onClose, currentName }) => {
    const [name, setName] = useState(currentName || "");
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();
    const { updateFullName } = useUserStore();

    // Reset name khi modal mở
    React.useEffect(() => {
        if (open) {
            setName(currentName || "");
        }
    }, [open, currentName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            await updateProfile(name.trim());
            updateFullName(name.trim());
            toast.success(t('common.profile.changeNameSuccess', 'Thay đổi tên thành công!'));
            onClose();
        } catch (err: any) {
            toast.error(err.message || t('common.profile.changeNameError', 'Có lỗi xảy ra, vui lòng thử lại sau.'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalShell open={open} onClose={onClose} title={t('common.profile.changeName', 'Đổi tên hiển thị')}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t('common.profile.fullName', 'Họ và Tên')}
                    </label>
                    <input
                        type="text"
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        placeholder={t('common.profile.newNamePlaceholder', 'Nhập tên mới của bạn...')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        maxLength={255}
                    />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                        type="button"
                        variant="outline"
                        className="border-slate-200 text-slate-600 hover:bg-slate-50"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Hủy
                    </Button>
                    <Button type="submit" disabled={!name.trim() || loading || name.trim() === currentName}>
                        {loading ? t('common.profile.saving', 'Đang lưu...') : t('common.profile.saveChanges', 'Lưu thay đổi')}
                    </Button>
                </div>
            </form>
        </ModalShell>
    );
};
