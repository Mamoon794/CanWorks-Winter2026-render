'use client';

import React, { useState, useEffect } from 'react';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
    Tabs, TabsContent, TabsList, TabsTrigger, Badge, Button,
} from '@/app/components/globalComponents';
import { BarChart3, Users, UserCheck, Briefcase, Calendar, Download, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { applicationApi, analyticsApi } from './api';
import type { EmployerAnalytics, ApplicationItem, ApplicationStatus } from '@/types';

const STATUS_OPTIONS: ApplicationStatus[] = ['pending', 'reviewing', 'interview', 'offer', 'rejected', 'hired'];

const STATUS_COLORS: Record<ApplicationStatus, string> = {
    pending: 'bg-gray-100 text-gray-700',
    reviewing: 'bg-blue-100 text-blue-700',
    interview: 'bg-purple-100 text-purple-700',
    offer: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    hired: 'bg-emerald-100 text-emerald-700',
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
    pending: 'Pending',
    reviewing: 'Reviewing',
    interview: 'Interview',
    offer: 'Offer Extended',
    rejected: 'Rejected',
    hired: 'Hired',
};

export function EmployerAnalyticsPage() {
    const [analytics, setAnalytics] = useState<EmployerAnalytics | null>(null);
    const [applications, setApplications] = useState<ApplicationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [analyticsRes, appsRes] = await Promise.all([
                analyticsApi.getEmployerAnalytics(),
                applicationApi.list({ page: 1, page_size: 50 }),
            ]);
            setAnalytics(analyticsRes.data);
            setApplications(appsRes.data.applications);
        } catch (error) {
            console.error('Failed to fetch analytics data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStatusUpdate = async (applicationId: string, newStatus: ApplicationStatus) => {
        try {
            await applicationApi.updateStatus(applicationId, newStatus);
            // Update local state
            setApplications(prev =>
                prev.map(a => a.id === applicationId ? { ...a, status: newStatus } : a)
            );
            // Refresh analytics to reflect the change
            const analyticsRes = await analyticsApi.getEmployerAnalytics();
            setAnalytics(analyticsRes.data);
        } catch (error) {
            console.error('Failed to update application status', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 py-12">
                    Loading analytics...
                </div>
            </div>
        );
    }

    const pipeline = analytics?.pipeline ?? { pending: 0, reviewing: 0, interview: 0, offer: 0, rejected: 0, hired: 0 };
    const jobCounts = analytics?.job_status_counts ?? { draft: 0, published: 0, expired: 0, deleted: 0 };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="mb-6">
                    <h1 className="text-2xl mb-2">Analytics & Applications</h1>
                    <p className="text-gray-600">Track your hiring metrics and manage applications</p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm">Total Applications</CardTitle>
                            <Users className="w-4 h-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl">{analytics?.total_applications ?? 0}</div>
                            <p className="text-xs text-gray-500 mt-1">All time</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm">Active Interviews</CardTitle>
                            <Calendar className="w-4 h-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl">{pipeline.interview}</div>
                            <p className="text-xs text-gray-500 mt-1">In progress</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm">Hired from CanWorks</CardTitle>
                            <UserCheck className="w-4 h-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl">{pipeline.hired}</div>
                            <p className="text-xs text-gray-500 mt-1">All time</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm">Published Jobs</CardTitle>
                            <Briefcase className="w-4 h-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl">{analytics?.total_published_jobs ?? 0}</div>
                            <p className="text-xs text-gray-500 mt-1">Currently active</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Tabs defaultValue="applications" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="applications">Applications</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="applications" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Recent Applications</CardTitle>
                                        <CardDescription>Manage and track candidate applications</CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <Download className="w-4 h-4 mr-2" />
                                        Export
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {applications.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No applications yet. Applications will appear here when students apply to your published jobs.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {applications.map((application) => (
                                            <div
                                                key={application.id}
                                                className="border rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <div
                                                    className="flex items-center justify-between p-4 cursor-pointer"
                                                    onClick={() => setExpandedId(expandedId === application.id ? null : application.id)}
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h3 className="font-medium">{application.student_name || 'Anonymous'}</h3>
                                                            {application.university && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {application.university}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600">{application.job_title}</p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Applied on {application.applied_at ? new Date(application.applied_at).toLocaleDateString() : 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <select
                                                            value={application.status}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                handleStatusUpdate(application.id, e.target.value as ApplicationStatus);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="text-sm border rounded px-2 py-1 bg-white"
                                                        >
                                                            {STATUS_OPTIONS.map((s) => (
                                                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                                            ))}
                                                        </select>
                                                        <Badge className={STATUS_COLORS[application.status]}>
                                                            {STATUS_LABELS[application.status]}
                                                        </Badge>
                                                        {expandedId === application.id ? (
                                                            <ChevronUp className="w-4 h-4 text-gray-400" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Expanded details */}
                                                {expandedId === application.id && (
                                                    <div className="px-4 pb-4 border-t pt-3 space-y-3 bg-gray-50">
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                            <div>
                                                                <span className="text-gray-500 block">Email</span>
                                                                <span>{application.student_email || 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 block">Major</span>
                                                                <span>{application.major || 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 block">Graduation Year</span>
                                                                <span>{application.graduation_year || 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500 block">Resume</span>
                                                                {application.resume_url ? (
                                                                    <a
                                                                        href={application.resume_url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                                                    >
                                                                        <FileText className="w-4 h-4" />
                                                                        {application.resume_filename || 'View Resume'}
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-gray-400">Not provided</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {application.relevant_experience && (
                                                            <div className="text-sm">
                                                                <span className="text-gray-500 block mb-1">Relevant Experience</span>
                                                                <p className="whitespace-pre-wrap bg-white border rounded p-3 text-gray-700">
                                                                    {application.relevant_experience}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Application Pipeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Application Pipeline</CardTitle>
                                <CardDescription>Overview of applications by stage</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 border rounded-lg">
                                        <div className="text-2xl mb-1">{pipeline.pending + pipeline.reviewing}</div>
                                        <div className="text-sm text-gray-600">Pending Review</div>
                                    </div>
                                    <div className="text-center p-4 border rounded-lg">
                                        <div className="text-2xl mb-1">{pipeline.interview}</div>
                                        <div className="text-sm text-gray-600">Interviews</div>
                                    </div>
                                    <div className="text-center p-4 border rounded-lg">
                                        <div className="text-2xl mb-1">{pipeline.offer}</div>
                                        <div className="text-sm text-gray-600">Offers Extended</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Hiring Metrics</CardTitle>
                                    <CardDescription>Key performance indicators</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Time to Hire (avg)</span>
                                        <span className="font-medium">
                                            {analytics?.time_to_hire_days != null ? `${analytics.time_to_hire_days} days` : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Offer Acceptance Rate</span>
                                        <span className="font-medium">
                                            {analytics?.offer_acceptance_rate != null ? `${analytics.offer_acceptance_rate}%` : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Applications per Position</span>
                                        <span className="font-medium">{analytics?.applications_per_position ?? 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Interview to Hire Ratio</span>
                                        <span className="font-medium">{analytics?.interview_to_hire_ratio ?? 'N/A'}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Job Posting Status</CardTitle>
                                    <CardDescription>Breakdown of your job postings</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Draft</span>
                                        <span className="font-medium">{jobCounts.draft}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Published</span>
                                        <span className="font-medium">{jobCounts.published}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Expired</span>
                                        <span className="font-medium">{jobCounts.expired}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Deleted</span>
                                        <span className="font-medium">{jobCounts.deleted}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Top Skills */}
                        {analytics && analytics.top_skills.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top Skills</CardTitle>
                                    <CardDescription>Most frequently required skills across your postings</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {analytics.top_skills.map((skill, index) => {
                                            const maxCount = analytics.top_skills[0]?.count || 1;
                                            return (
                                                <div key={skill.skill_name} className="flex items-center justify-between">
                                                    <span className="text-sm">{skill.skill_name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-600 rounded-full"
                                                                style={{ width: `${(skill.count / maxCount) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm text-gray-600 w-8">{skill.count}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Top Universities */}
                        {analytics && analytics.top_universities.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top Universities</CardTitle>
                                    <CardDescription>Applications by university</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {analytics.top_universities.map((uni) => {
                                            const maxCount = analytics.top_universities[0]?.count || 1;
                                            return (
                                                <div key={uni.university} className="flex items-center justify-between">
                                                    <span className="text-sm">{uni.university}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-600 rounded-full"
                                                                style={{ width: `${(uni.count / maxCount) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm text-gray-600 w-8">{uni.count}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
