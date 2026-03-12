'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from '@/app/components/globalComponents';
import { TrendingUp, Briefcase, Users, Bookmark, FileText, MousePointerClick, RotateCcw, Database } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminAnalyticsApi } from './api';
import type { AdminAnalytics } from '@/types';

const CustomXAxisTick = (props: { x?: number; y?: number; payload?: { value: string } }) => {
    const { x, y, payload } = props;
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-45)" fontSize={12}>
                {payload?.value}
            </text>
        </g>
    );
};

export default function AdminReports() {
    const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminAnalyticsApi.get()
            .then(res => setAnalytics(res.data))
            .catch(err => console.error('Failed to fetch admin analytics', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="text-center text-gray-500 py-12">Loading analytics...</div>;
    }

    if (!analytics) {
        return <div className="text-center text-gray-500 py-12">Failed to load analytics. Please make sure you are logged in as an admin.</div>;
    }

    const { pipeline } = analytics;

    return (
        <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Admin Job Postings</CardDescription>
                        <CardTitle className="text-3xl">{analytics.total_admin_jobs}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Briefcase className="w-4 h-4" />
                            <span>Active uploaded jobs</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Employer Job Postings</CardDescription>
                        <CardTitle className="text-3xl">{analytics.total_employer_jobs}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FileText className="w-4 h-4" />
                            <span>Published by employers</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Applications</CardDescription>
                        <CardTitle className="text-3xl">{analytics.total_applications}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>Platform-wide</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Saved Jobs</CardDescription>
                        <CardTitle className="text-3xl">{analytics.total_saved_jobs}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Bookmark className="w-4 h-4" />
                            <span>Avg {analytics.avg_saved_per_user} per user</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Application Pipeline */}
            <Card>
                <CardHeader>
                    <CardTitle>Application Pipeline</CardTitle>
                    <CardDescription>Platform-wide application status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {([
                            ['Pending', pipeline.pending, 'bg-gray-100 text-gray-700'],
                            ['Reviewing', pipeline.reviewing, 'bg-blue-100 text-blue-700'],
                            ['Interview', pipeline.interview, 'bg-purple-100 text-purple-700'],
                            ['Offer', pipeline.offer, 'bg-green-100 text-green-700'],
                            ['Rejected', pipeline.rejected, 'bg-red-100 text-red-700'],
                            ['Hired', pipeline.hired, 'bg-emerald-100 text-emerald-700'],
                        ] as [string, number, string][]).map(([label, count, color]) => (
                            <div key={label} className="text-center p-4 border rounded-lg">
                                <div className="text-2xl mb-1">{count}</div>
                                <Badge className={color}>{label}</Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Jobs by Type */}
                {analytics.jobs_by_type.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Jobs by Type
                            </CardTitle>
                            <CardDescription>Distribution of admin-uploaded jobs by category</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.jobs_by_type} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="job_type" interval={0} tick={<CustomXAxisTick />} height={80} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Jobs by Province */}
                {analytics.jobs_by_province.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Jobs by Province
                            </CardTitle>
                            <CardDescription>Geographic distribution of all jobs</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.jobs_by_province} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="province" interval={0} tick={<CustomXAxisTick />} height={80} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
                                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Employer Job Status + Top Skills + Top Universities */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Employer Job Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Employer Job Status</CardTitle>
                        <CardDescription>Breakdown of employer job postings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {([
                            ['Draft', analytics.employer_job_status.draft],
                            ['Published', analytics.employer_job_status.published],
                            ['Expired', analytics.employer_job_status.expired],
                            ['Deleted', analytics.employer_job_status.deleted],
                        ] as [string, number][]).map(([label, count]) => (
                            <div key={label} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{label}</span>
                                <span className="font-medium">{count}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Top Skills */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Skills in Demand</CardTitle>
                        <CardDescription>Most requested skills across employer postings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics.top_skills.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No skill data yet</p>
                        ) : (
                            <div className="space-y-3">
                                {analytics.top_skills.map((skill) => {
                                    const maxCount = analytics.top_skills[0]?.count || 1;
                                    return (
                                        <div key={skill.skill_name} className="flex items-center justify-between">
                                            <span className="text-sm">{skill.skill_name}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-600 rounded-full"
                                                        style={{ width: `${(skill.count / maxCount) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-gray-600 w-6">{skill.count}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Universities */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Universities</CardTitle>
                        <CardDescription>Most common applicant universities</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics.top_universities.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No applicant data yet</p>
                        ) : (
                            <div className="space-y-3">
                                {analytics.top_universities.map((uni) => {
                                    const maxCount = analytics.top_universities[0]?.count || 1;
                                    return (
                                        <div key={uni.university} className="flex items-center justify-between">
                                            <span className="text-sm">{uni.university}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-600 rounded-full"
                                                        style={{ width: `${(uni.count / maxCount) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-gray-600 w-6">{uni.count}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Returning Visitor Rate + Registered Users + Clicks by Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Returning Visitor Rate */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Returning Visitor Rate</CardDescription>
                        <CardTitle className="text-3xl">
                            {analytics.returning_visitor_rate != null ? `${analytics.returning_visitor_rate}%` : 'N/A'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <RotateCcw className="w-4 h-4" />
                            <span>Users who visited more than once (last 30 days)</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Registered User Counts */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-600" />
                            Registered Users
                        </CardTitle>
                        <CardDescription>Breakdown by user type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics.user_counts.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No user data available</p>
                        ) : (
                            <div className="space-y-3">
                                {analytics.user_counts.map((uc) => (
                                    <div key={uc.user_type} className="flex items-center justify-between">
                                        <span className="text-sm capitalize">{uc.user_type}</span>
                                        <span className="font-medium">{uc.count}</span>
                                    </div>
                                ))}
                                <div className="pt-2 border-t flex items-center justify-between">
                                    <span className="text-sm font-medium">Total</span>
                                    <span className="font-bold">{analytics.user_counts.reduce((sum, uc) => sum + uc.count, 0)}</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Clicks by Job Type */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MousePointerClick className="w-5 h-5 text-orange-600" />
                            Outbound Clicks by Type
                        </CardTitle>
                        <CardDescription>Click-to-apply events by job category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics.clicks_by_type.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No click data yet</p>
                        ) : (
                            <div className="space-y-3">
                                {analytics.clicks_by_type.map((item) => {
                                    const maxClicks = analytics.clicks_by_type[0]?.clicks || 1;
                                    return (
                                        <div key={item.job_type} className="flex items-center justify-between">
                                            <span className="text-sm">{item.job_type}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-orange-500 rounded-full"
                                                        style={{ width: `${(item.clicks / maxClicks) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-gray-600 w-6">{item.clicks}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Data Feed Logs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-purple-600" />
                        Recent Data Feed Logs
                    </CardTitle>
                    <CardDescription>History of job data uploads and imports</CardDescription>
                </CardHeader>
                <CardContent>
                    {analytics.recent_feed_logs.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No feed logs yet</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-gray-600">
                                        <th className="pb-2 pr-4">Source</th>
                                        <th className="pb-2 pr-4">Status</th>
                                        <th className="pb-2 pr-4">Added</th>
                                        <th className="pb-2 pr-4">Skipped</th>
                                        <th className="pb-2 pr-4">Errors</th>
                                        <th className="pb-2">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.recent_feed_logs.map((log) => (
                                        <tr key={log.id} className="border-b last:border-0">
                                            <td className="py-2 pr-4">{log.source}</td>
                                            <td className="py-2 pr-4">
                                                <Badge className={
                                                    log.status === 'success'
                                                        ? 'bg-green-100 text-green-700'
                                                        : log.status === 'partial'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-red-100 text-red-700'
                                                }>
                                                    {log.status}
                                                </Badge>
                                            </td>
                                            <td className="py-2 pr-4">{log.jobs_added}</td>
                                            <td className="py-2 pr-4">{log.jobs_skipped}</td>
                                            <td className="py-2 pr-4">{log.errors?.length || 0}</td>
                                            <td className="py-2">
                                                {log.created_at ? new Date(log.created_at).toLocaleString() : 'Unknown'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
