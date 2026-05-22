import React, { useState } from "react";
import {
    Stethoscope, Moon, Sun, Search,
    HelpCircle, MessageCircle, Phone, Mail,
    ChevronDown, ChevronUp, Send, CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserMe } from "@/services/hooks/hookAuth";
import { removeAuthCookies } from "@/lib/helper/token";
import { getUserRole } from "@/lib/helper";
import { ProfileMenuDialog } from "@/components/chat/ProfileMenuDialog";
import { ResetPasswordDialog } from "@/components/auth/ResetPasswordDialog";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useTranslation } from "react-i18next";

const SupportPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);
    const profileAnchorRef = React.useRef<HTMLButtonElement>(null);

    const { getuserMe } = useUserMe();
    const [userInfo, setUserInfo] = useState<any>(null);

    // FAQ State
    const [activeTab, setActiveTab] = useState<"faq" | "contact">("faq");
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
    const [searchQuery, setSearchQuery] = useState("");
    const ALL_CAT = "ALL_CATEGORIES";
    const [selectedCategory, setSelectedCategory] = useState(ALL_CAT);

    React.useEffect(() => {
        getuserMe().then((data) => {
            if (data) setUserInfo(data);
        });
    }, []);

    const handleLogout = () => {
        removeAuthCookies();
        navigate("/login", { replace: true });
    };

    const FAQS = t('support.faqs', { returnObjects: true }) as Array<{ category: string; question: string; answer: string }> || [];

    const categories = [ALL_CAT, ...Array.from(new Set(FAQS.map(f => f.category)))];

    const filteredFaqs = FAQS.filter(
        (f) =>
            (selectedCategory === ALL_CAT || f.category === selectedCategory) &&
            (f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col">
            {/* Navigation */}
            <nav className="sticky top-0 w-full z-50 glass-effect bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                                <Stethoscope className="w-6 h-6" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Doctor AI
                            </span>
                        </div>

                        <div className="hidden md:flex items-center space-x-8">
                            <button onClick={() => navigate("/")} className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">{t('home.nav.home')}</button>
                            {getUserRole() === "admin" && (
                                <button onClick={() => navigate("/dashboard")} className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">{t('home.nav.dashboard')}</button>
                            )}
                            <button onClick={() => navigate("/chat")} className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">{t('home.nav.chat')}</button>
                            <button className="text-sm font-bold text-primary transition-colors">{t('home.nav.support')}</button>
                            <LanguageSwitcher />
                            <button
                                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                onClick={() => document.documentElement.classList.toggle("dark")}
                            >
                                <Moon className="w-5 h-5 dark:hidden text-slate-600" />
                                <Sun className="w-5 h-5 hidden dark:block text-slate-300" />
                            </button>
                            <button
                                ref={profileAnchorRef}
                                onClick={() => setProfileOpen(true)}
                                className="flex items-center gap-2 p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                                <img
                                    alt={userInfo?.full_name || "User"}
                                    className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                                    src="https://picsum.photos/seed/alex/100/100"
                                />
                                <span className="hidden md:inline text-sm font-bold text-slate-700 dark:text-white truncate max-w-[140px]">
                                    {userInfo?.full_name || "Guest"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">{t('support.header.title')}</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400">{t('support.header.desc')}</p>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-10 w-fit">
                    <button
                        onClick={() => setActiveTab("faq")}
                        className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "faq"
                            ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                    >
                        {t('support.tabs.faqs')}
                    </button>
                    <button
                        onClick={() => setActiveTab("contact")}
                        className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "contact"
                            ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                    >
                        {t('support.tabs.contact')}
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === "faq" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Search Bar */}
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('support.search.placeholder')}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white placeholder-slate-400 text-base"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        </div>

                        {/* Category Pills */}
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${selectedCategory === cat
                                        ? "bg-primary text-white border-primary"
                                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-primary/50"
                                        }`}
                                >
                                    {cat === ALL_CAT ? t('support.search.all') : cat}
                                </button>
                            ))}
                        </div>

                        {/* FAQ List */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                            {filteredFaqs.length > 0 ? (
                                filteredFaqs.map((faq, idx) => (
                                    <div
                                        key={idx}
                                        className={`transition-all border-b last:border-0 border-slate-100 dark:border-slate-800 ${openFaqIndex === idx ? "bg-slate-50/80 dark:bg-slate-800/50" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                                            }`}
                                    >
                                        <button
                                            onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                                            className="w-full flex items-center justify-between p-6 text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs rounded-md font-bold uppercase tracking-wider">
                                                    {faq.category}
                                                </span>
                                                <span className={`font-semibold text-lg ${openFaqIndex === idx ? "text-primary" : "text-slate-900 dark:text-white"}`}>
                                                    {faq.question}
                                                </span>
                                            </div>
                                            <div className={`transition-transform duration-300 ${openFaqIndex === idx ? "rotate-180" : ""}`}>
                                                {openFaqIndex === idx ?
                                                    <ChevronUp className="w-5 h-5 text-primary" /> :
                                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                                }
                                            </div>
                                        </button>
                                        <div
                                            className={`grid transition-all duration-300 ease-in-out ${openFaqIndex === idx ? "grid-rows-[1fr] opacity-100 mb-6" : "grid-rows-[0fr] opacity-0"
                                                }`}
                                        >
                                            <div className="overflow-hidden">
                                                <div className="px-6 ml-16 text-slate-600 dark:text-slate-400 leading-relaxed border-l-2 border-slate-200 dark:border-slate-700 pl-6">
                                                    {faq.answer}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-16">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 mb-4">
                                        <Search className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('support.search.noResults')}</h3>
                                    <p className="text-slate-500">{t('support.search.noResultsDesc')} "{searchQuery}".</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "contact" && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Contact Channels Grid */}
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { icon: MessageCircle, title: t('support.contact.liveChat'), desc: t('support.contact.liveChatDesc'), action: t('support.contact.startChat') },
                                { icon: Mail, title: t('support.contact.email'), desc: t('support.contact.emailDesc'), action: "chatbot@vlu.vn" },
                                { icon: Phone, title: t('support.contact.phone'), desc: t('support.contact.phoneDesc'), action: "+84 (077) 339 6195" },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all shadow-sm">
                                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">{item.desc}</p>
                                    <div className="font-semibold text-primary flex items-center gap-2 cursor-pointer hover:underline">
                                        {item.action}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white dark:bg-slate-900 shadow-slate-200/50 dark:shadow-none p-10 rounded-3xl border border-slate-200 dark:border-slate-800">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('support.form.title')}</h2>
                            <form className="grid gap-6 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('support.form.nameLabel')}</label>
                                    <input type="text" placeholder={t('support.form.namePlace')} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('support.form.emailLabel')}</label>
                                    <input type="email" placeholder={t('support.form.emailPlace')} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('support.form.subjectLabel')}</label>
                                    <select className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-600">
                                        <option>{t('support.form.sub1')}</option>
                                        <option>{t('support.form.sub2')}</option>
                                        <option>{t('support.form.sub3')}</option>
                                        <option>{t('support.form.sub4')}</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('support.form.messageLabel')}</label>
                                    <textarea rows={5} placeholder={t('support.form.messagePlace')} className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
                                </div>
                                <div className="md:col-span-2 pt-4">
                                    <Button className="w-full py-4 text-base font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                                        {t('support.form.send')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            {/* Profile Dialogs */}
            <ProfileMenuDialog
                open={profileOpen}
                onClose={() => setProfileOpen(false)}
                anchorRef={profileAnchorRef}
                userInfo={userInfo}
                onChangePassword={() => setResetOpen(true)}
                onSignOut={() => {
                    handleLogout();
                    setProfileOpen(false);
                }}
            />
            <ResetPasswordDialog
                open={resetOpen}
                onClose={() => setResetOpen(false)}
                onSuccess={() => navigate("/login", { replace: true })}
            />
        </div>
    );
};

export default SupportPage;
