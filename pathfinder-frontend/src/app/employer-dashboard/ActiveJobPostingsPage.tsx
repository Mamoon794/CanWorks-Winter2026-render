'use client'

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/globalComponents';
import { CheckCircle } from 'lucide-react';
import { jobDescriptionApi } from './api';
import { JobDescriptionCard } from './JobDescriptionCard';
import { JobDescriptionWizard } from './JobDescriptionWizard';
import type { JobDescription } from '@/types';

export function ActiveJobPostingsPage() {
    const [jobs, setJobs] = useState<JobDescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingJobId, setEditingJobId] = useState<string | null>(null);

    const fetchActive = useCallback(async () => {
        setLoading(true);
        try {
            const response = await jobDescriptionApi.list({ status: 'published' });
            setJobs(response.data.job_descriptions);
        } catch (error) {
            console.error('Failed to fetch active postings', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchActive(); }, [fetchActive]);

    const handleUnpublish = async (id: string) => {
        try {
            await jobDescriptionApi.unpublish(id);
            fetchActive();
        } catch (error) {
            console.error('Failed to unpublish', error);
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            await jobDescriptionApi.duplicate(id);
            fetchActive();
        } catch (error) {
            console.error('Failed to duplicate', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await jobDescriptionApi.delete(id);
            fetchActive();
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    if (editingJobId) {
        return (
            <JobDescriptionWizard
                jobId={editingJobId}
                templateData={null}
                onComplete={() => { setEditingJobId(null); fetchActive(); }}
                onCancel={() => setEditingJobId(null)}
            />
        );
    }

    if (loading) {
        return <div className="text-center py-12 text-slate-500">Loading active postings...</div>;
    }

    if (jobs.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No active job postings. Publish a draft to see it here.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <CardHeader className="px-0">
                <CardTitle>Active Job Postings ({jobs.length})</CardTitle>
            </CardHeader>
            <div className="space-y-3">
                {jobs.map((job) => (
                    <JobDescriptionCard
                        key={job.id}
                        job={job}
                        onEdit={() => setEditingJobId(job.id)}
                        onDuplicate={handleDuplicate}
                        onUnpublish={handleUnpublish}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
        </div>
    );
}
