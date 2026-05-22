import React from "react";
import { User, Shield, Bot, ChevronRight, Check, AlertCircle } from "lucide-react";
import {
    getSystemSettings,
    getAdminProfile,
    updateSystemSettings,
    updateAdminProfile,
    SystemSettings,
    AdminProfile,
} from "@/services/apis/admin";
import { useTranslation } from "react-i18next";
import { notify } from "@/utils/notify";

// ── Shared helpers ──────────────────────────────────────────────────────────

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
        {children}
    </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className={`w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900 text-[13px] font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors ${props.className ?? ""}`}
    />
);

const SectionCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    children: React.ReactNode;
}> = ({ icon, title, subtitle, children }) => (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <div className="text-[13px] font-extrabold text-slate-800 dark:text-white">{title}</div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500">{subtitle}</div>
            </div>
        </div>
        <div className="p-6 space-y-4">{children}</div>
    </div>
);

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
    return (
        <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold ${type === "success"
                    ? "bg-teal-50 border border-teal-200 text-teal-700"
                    : "bg-red-50 border border-red-200 text-red-600"
                }`}
        >
            {type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {msg}
        </div>
    );
}

// ── Toggle component ────────────────────────────────────────────────────────

const Toggle: React.FC<{ value: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({
    value,
    onChange,
    disabled,
}) => (
    <button
        onClick={() => !disabled && onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? "bg-teal-500" : "bg-slate-200"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? "translate-x-6" : "translate-x-1"
                }`}
        />
    </button>
);

// ── Main Component ──────────────────────────────────────────────────────────

export default function SettingsView() {
    const { t } = useTranslation();
    // ── System settings state ────────────────────────────────────
    const [sysSettings, setSysSettings] = React.useState<SystemSettings | null>(null);
    const [sysLoading, setSysLoading] = React.useState(false);
    const [sysMsg, setSysMsg] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

    // ── Profile state ─────────────────────────────────────────────
    const [profile, setProfile] = React.useState<AdminProfile | null>(null);
    const [profileForm, setProfileForm] = React.useState({ full_name: "", email: "" });
    const [pwForm, setPwForm] = React.useState({ current_password: "", new_password: "", confirm: "" });
    const [profileLoading, setProfileLoading] = React.useState(false);
    const [profileMsg, setProfileMsg] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

    // ── Load data ─────────────────────────────────────────────────
    React.useEffect(() => {
        Promise.all([getSystemSettings(), getAdminProfile()]).then(([sys, prof]) => {
            setSysSettings(sys);
            setProfile(prof);
            setProfileForm({ full_name: prof.name, email: prof.email });
        });
    }, []);

    // ── System settings handlers ───────────────────────────────────

    const handleSysChange = async <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
        if (!sysSettings) return;
        const updated = { ...sysSettings, [key]: value };
        setSysSettings(updated);
        setSysLoading(true);
        setSysMsg(null);
        try {
            const saved = await updateSystemSettings({ [key]: value });
            setSysSettings(saved);
            const successMsg = t('admin.settingsView.settingsSaved', 'Settings saved.');
            setSysMsg({ text: successMsg, type: "success" });
            notify(t('admin.settingsView.systemEvent', 'System Event'), successMsg, 'success');
        } catch (e: any) {
            setSysSettings(sysSettings); // revert
            const errMsg = e?.response?.data?.detail ?? t('admin.settingsView.failedToSave', 'Failed to save.');
            setSysMsg({ text: errMsg, type: "error" });
            notify(t('admin.settingsView.updateFailed', 'Update Failed'), errMsg, 'error');
        } finally {
            setSysLoading(false);
            setTimeout(() => setSysMsg(null), 3000);
        }
    };

    // ── Profile save ──────────────────────────────────────────────
    const saveProfile = async () => {
        setProfileLoading(true);
        setProfileMsg(null);
        try {
            const updated = await updateAdminProfile({
                full_name: profileForm.full_name || undefined,
                email: profileForm.email || undefined,
            });
            setProfile(updated);
            setProfileForm({ full_name: updated.name, email: updated.email });
            const successMsg = t('admin.settingsView.profileUpdated', 'Profile updated.');
            setProfileMsg({ text: successMsg, type: "success" });
            notify(t('admin.settingsView.profileEvent', 'Profile Event'), successMsg, 'success');
        } catch (e: any) {
            const errMsg = e?.response?.data?.detail ?? t('admin.settingsView.failedToUpdateProfile', 'Failed to update profile.');
            setProfileMsg({ text: errMsg, type: "error" });
            notify(t('admin.settingsView.updateFailed', 'Update Failed'), errMsg, 'error');
        } finally {
            setProfileLoading(false);
            setTimeout(() => setProfileMsg(null), 3500);
        }
    };

    const savePassword = async () => {
        if (!pwForm.current_password || !pwForm.new_password) return;
        if (pwForm.new_password !== pwForm.confirm) {
            setProfileMsg({ text: t('admin.settingsView.passwordMismatch', 'New passwords do not match.'), type: "error" });
            return;
        }
        if (pwForm.new_password.length < 6) {
            setProfileMsg({ text: t('admin.settingsView.passwordTooShort', 'New password must be at least 6 characters.'), type: "error" });
            return;
        }
        setProfileLoading(true);
        setProfileMsg(null);
        try {
            await updateAdminProfile({
                current_password: pwForm.current_password,
                new_password: pwForm.new_password,
            });
            setPwForm({ current_password: "", new_password: "", confirm: "" });
            const successMsg = t('admin.settingsView.passwordChanged', 'Password changed.');
            setProfileMsg({ text: successMsg, type: "success" });
            notify(t('admin.settingsView.securityEvent', 'Security Event'), successMsg, 'success');
        } catch (e: any) {
            const errMsg = e?.response?.data?.detail ?? t('admin.settingsView.failedToChangePassword', 'Failed to change password.');
            setProfileMsg({ text: errMsg, type: "error" });
            notify(t('admin.settingsView.updateFailed', 'Update Failed'), errMsg, 'error');
        } finally {
            setProfileLoading(false);
            setTimeout(() => setProfileMsg(null), 3500);
        }
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div className="text-[11px] text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-2 rounded-xl transition-colors">
                {t('admin.settingsView.warningRestart', '⚠️ AI/System configurations will reset to default if server restarts.')}
            </div>

            {/* ── 1. Admin Profile ─────────────────────────────────── */}
            <SectionCard
                icon={<User className="w-5 h-5" />}
                title={t('admin.settingsView.adminProfile', 'Admin Profile')}
                subtitle={t('admin.settingsView.adminProfileDesc', 'Update your display name and email')}
            >
                <div>
                    <Label>{t('admin.settingsView.fullName', 'Full Name')}</Label>
                    <Input
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))}
                        placeholder={t('admin.users.fullNamePlaceholder', 'Full name')}
                    />
                </div>
                <div>
                    <Label>{t('admin.settingsView.email', 'Email')}</Label>
                    <Input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder={t('admin.users.emailPlaceholder', 'email@example.com')}
                    />
                </div>
                <div className="flex items-center justify-between pt-1">
                    {profileMsg && <Toast msg={profileMsg.text} type={profileMsg.type} />}
                    <div className="ml-auto">
                        <button
                            onClick={saveProfile}
                            disabled={profileLoading}
                            className="h-9 px-5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-[12px] font-extrabold disabled:opacity-50"
                        >
                            {profileLoading ? t('admin.settingsView.saving', 'Saving...') : t('admin.settingsView.saveProfile', 'Save Profile')}
                        </button>
                    </div>
                </div>
            </SectionCard>

            {/* ── 2. Change Password ────────────────────────────────── */}
            <SectionCard
                icon={<Shield className="w-5 h-5" />}
                title={t('admin.settingsView.changePassword', 'Change Password')}
                subtitle={t('admin.settingsView.changePasswordDesc', 'Keep your admin account secure')}
            >
                <div>
                    <Label>{t('admin.settingsView.currentPassword', 'Current Password')}</Label>
                    <Input
                        type="password"
                        value={pwForm.current_password}
                        onChange={(e) => setPwForm((p) => ({ ...p, current_password: e.target.value }))}
                        placeholder="••••••••"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label>{t('admin.settingsView.newPassword', 'New Password')}</Label>
                        <Input
                            type="password"
                            value={pwForm.new_password}
                            onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))}
                            placeholder={t('admin.settingsView.min6chars', 'Min. 6 characters')}
                        />
                    </div>
                    <div>
                        <Label>{t('admin.settingsView.confirmPassword', 'Confirm Password')}</Label>
                        <Input
                            type="password"
                            value={pwForm.confirm}
                            onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                            placeholder={t('admin.settingsView.repeatPassword', 'Repeat password')}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                    {profileMsg && pwForm.current_password && (
                        <Toast msg={profileMsg.text} type={profileMsg.type} />
                    )}
                    <div className="ml-auto">
                        <button
                            onClick={savePassword}
                            disabled={profileLoading || !pwForm.current_password || !pwForm.new_password}
                            className="h-9 px-5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white text-[12px] font-extrabold disabled:opacity-50 transition-colors"
                        >
                            {t('admin.settingsView.changePassword', 'Change Password')}
                        </button>
                    </div>
                </div>
            </SectionCard>

            {/* ── 3. System Settings ────────────────────────────────── */}
            <SectionCard
                icon={<Bot className="w-5 h-5" />}
                title={t('admin.settingsView.systemSettings', 'System & AI Config')}
                subtitle={t('admin.settingsView.systemSettingsDesc', 'Runtime configuration — resets on server restart')}
            >
                {sysSettings ? (
                    <>
                        {/* Allow Signup */}
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{t('admin.settingsView.userRegistration', 'User Self-Registration')}</div>
                                <div className="text-[11px] text-slate-400">
                                    {t('admin.settingsView.userRegistrationDesc', 'Allow new users to register from the signup page')}
                                </div>
                            </div>
                            <Toggle
                                value={sysSettings.allow_signup}
                                onChange={(v) => handleSysChange("allow_signup", v)}
                                disabled={sysLoading}
                            />
                        </div>

                        {/* RAG Top-K */}
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{t('admin.settingsView.ragTopK', 'RAG Top-K')}</div>
                                <div className="text-[11px] text-slate-400">
                                    {t('admin.settingsView.ragTopKDesc', 'Number of document chunks retrieved per query (1–20)')}
                                </div>
                            </div>
                            <input
                                type="number"
                                min={1}
                                max={20}
                                value={sysSettings.qa_topk}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value);
                                    if (!isNaN(v) && v >= 1 && v <= 20)
                                        setSysSettings((s) => s ? { ...s, qa_topk: v } : s);
                                }}
                                onBlur={() => handleSysChange("qa_topk", sysSettings.qa_topk)}
                                className="w-20 h-9 text-center rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900 text-[13px] font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
                            />
                        </div>

                        {/* Gemini Model */}
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{t('admin.settingsView.geminiModel', 'Gemini Model')}</div>
                                <div className="text-[11px] text-slate-400 dark:text-slate-500">
                                    {t('admin.settingsView.geminiModelDesc', 'Active Gemini model used for all chat responses')}
                                </div>
                            </div>
                            <select
                                value={sysSettings.gemini_model}
                                onChange={(e) => handleSysChange("gemini_model", e.target.value)}
                                disabled={sysLoading}
                                className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[12px] font-semibold outline-none focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-colors"
                            >
                                <option value="models/gemini-2.5-flash">gemini-2.5-flash</option>
                                <option value="models/gemini-2.0-flash">gemini-2.0-flash</option>
                                <option value="models/gemini-1.5-pro">gemini-1.5-pro</option>
                                <option value="models/gemini-1.5-flash">gemini-1.5-flash</option>
                            </select>
                        </div>

                        {sysMsg && <Toast msg={sysMsg.text} type={sysMsg.type} />}
                    </>
                ) : (
                    <div className="text-[12px] text-slate-400 animate-pulse py-4 text-center">
                        {t('admin.settingsView.loadingSettings', 'Loading settings...')}
                    </div>
                )}
            </SectionCard>
        </div>
    );
}
