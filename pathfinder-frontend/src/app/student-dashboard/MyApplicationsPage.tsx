'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/app/components/globalComponents';
import { FileText } from 'lucide-react';
import fastAxiosInstance from '@/axiosConfig/axiosfig';
import type { ApplicationItem, ApplicationStatus } from '@/types';

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

export function MyApplicationsPage() {
    const [applications, setApplications] = useState<ApplicationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fastAxiosInstance.get('/api/applications/mine', { params: { page: 1, page_size: 50 } })
            .then(res => setApplications(res.data.applications))
            .catch(err => console.error('Failed to fetch applications', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <p className="text-center text-gray-500 py-8">Loading your applications...</p>;
    }

    if (applications.length === 0) {
        return (
            <Card className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg mb-2">No applications yet</h3>
                <p className="text-gray-600">Browse employer jobs in the Explore tab and apply to get started.</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl">My Applications ({applications.length})</h2>
            {applications.map(app => (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-lg">{app.job_title || 'Untitled Position'}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Applied on {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                            <Badge className={STATUS_COLORS[app.status]}>
                                {STATUS_LABELS[app.status]}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
