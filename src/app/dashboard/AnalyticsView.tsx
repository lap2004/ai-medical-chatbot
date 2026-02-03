import React, { useEffect, useState } from "react";
import { getAnalytics } from "@/services/apis/admin";
import { AnalyticsStats } from "@/types/admin";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function AnalyticsView() {
    const [stats, setStats] = useState<AnalyticsStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAnalytics()
            .then((data) => setStats(data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-10 text-center text-slate-500">Loading analytics...</div>;

    const reportData = stats?.reports.breakdown.map((item) => ({
        name: item.category,
        value: item.count,
    })) || [];

    const feedbackData = [
        { name: "Likes", value: stats?.likes || 0 },
        { name: "Dislikes", value: stats?.dislikes || 0 },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Analytics Reports</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reports Breakdown Pie Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Reports by Category</h3>
                    <div className="h-[300px]">
                        {reportData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={reportData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {reportData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">No report data available</div>
                        )}
                    </div>
                </div>

                {/* Feedback Bar Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Feedback Overview</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={feedbackData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" fill="#8884d8">
                                    {feedbackData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Likes' ? '#10b981' : '#f43f5e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Report Count Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Report Details</h3>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="pb-3 font-medium text-slate-500">Category</th>
                                <th className="pb-3 font-medium text-slate-500 text-right">Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((row, i) => (
                                <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                    <td className="py-3 text-slate-800 dark:text-slate-300">{row.name}</td>
                                    <td className="py-3 text-right font-bold text-slate-900 dark:text-white">{row.value}</td>
                                </tr>
                            ))}
                            {reportData.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="py-4 text-center text-slate-400">No reports found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Top Users Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Top Active Users</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="pb-3 font-medium text-slate-500">User</th>
                                    <th className="pb-3 font-medium text-slate-500 text-right">Messages</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.top_users?.map((user, i) => (
                                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                        <td className="py-3 text-slate-800 dark:text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                    {i + 1}
                                                </div>
                                                <span className="truncate max-w-[150px]" title={user.email}>{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-right font-bold text-slate-900 dark:text-white">{user.count}</td>
                                    </tr>
                                ))}
                                {(!stats?.top_users || stats.top_users.length === 0) && (
                                    <tr>
                                        <td colSpan={2} className="py-4 text-center text-slate-400">No data available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
