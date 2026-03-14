import React, { useEffect, useState } from "react";
import { Users, MessageSquare, ThumbsUp, Flag } from "lucide-react";
import { getAnalytics } from "@/services/apis/admin";
import { AnalyticsStats } from "@/types/admin";
import GrowthChartCard from "@/components/admin/GrowthChartCard";
import { CHART_DATA } from "@/data"; // Keep mock data for chart for now, or update if we have real time-series
import { useTranslation } from "react-i18next";

const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    trend,
}: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    trend?: string;
}) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
                <Icon className={`w-6 h-6 ${color.replace("bg-", "text-")}`} />
            </div>
        </div>
        {trend && (
            <div className="mt-4 flex items-center text-sm">
                <span className="text-emerald-500 font-medium">{trend}</span>
                <span className="ml-2 text-slate-400">vs last month</span>
            </div>
        )}
    </div>
);

export default function DashboardView() {
    const { t } = useTranslation();
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAnalytics()
            .then((data) => setStats(data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-10 text-center text-slate-500">{t('dashboard.loadingMetrics', 'Loading metrics...')}</div>;

    return (
        <div className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t('dashboard.totalUsers', 'Total Users')}
                    value={stats?.users || 0}
                    icon={Users}
                    color="bg-blue-500"
                    trend="+12%"
                />
                <StatCard
                    title={t('dashboard.totalMessages', 'Total Messages')}
                    value={stats?.messages || 0}
                    icon={MessageSquare}
                    color="bg-indigo-500"
                    trend="+24%"
                />
                <StatCard
                    title={t('dashboard.positiveFeedback', 'Positive Feedback')}
                    value={stats?.likes || 0}
                    icon={ThumbsUp}
                    color="bg-emerald-500"
                />
                <StatCard
                    title={t('dashboard.totalReports', 'Total Reports')}
                    value={stats?.reports.total || 0}
                    icon={Flag}
                    color="bg-rose-500"
                />
            </div>

            {/* Charts & Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Reusing existing chart with mock data for now, since backend analytics didn't implement time-series yet */}
                    <GrowthChartCard data={CHART_DATA} />

                    {/* Recent Activity */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('dashboard.recentActivity', 'Recent Activity')}</h3>
                        <div className="space-y-4">
                            {stats?.recent_activities?.slice().reverse().map((activity, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                                    <div className={`mt-0.5 min-w-[32px] w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'feedback'
                                        ? (activity.value === 'like' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600')
                                        : 'bg-orange-100 text-orange-600'
                                        }`}>
                                        {activity.type === 'feedback' ? (
                                            activity.value === 'like' ? <ThumbsUp size={14} /> :
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.42 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" /></svg>
                                        ) : (
                                            <Flag size={14} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900 dark:text-gray-100">
                                            <span className="font-semibold">{activity.user}</span>
                                            <span className="text-slate-500 font-normal">
                                                {activity.type === 'feedback'
                                                    ? ` ${activity.value}d a message`
                                                    : ` reported a message for `}
                                                {activity.category && <span className="font-medium text-orange-500">{activity.category}</span>}
                                            </span>
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {new Date(activity.time).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {(!stats?.recent_activities || stats.recent_activities.length === 0) && (
                                <div className="text-center text-slate-400 py-4">{t('dashboard.noRecentActivity', 'No recent activity')}</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Feedback Summary Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('dashboard.feedbackSummary', 'Feedback Summary')}</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <ThumbsUp size={16} />
                                </div>
                                <span className="text-slate-700 dark:text-slate-300">{t('dashboard.likes', 'Likes')}</span>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">{stats?.likes || 0}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-thumbs-down"><path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.42 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" /></svg>
                                </div>
                                <span className="text-slate-700 dark:text-slate-300">{t('dashboard.dislikes', 'Dislikes')}</span>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">{stats?.dislikes || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
