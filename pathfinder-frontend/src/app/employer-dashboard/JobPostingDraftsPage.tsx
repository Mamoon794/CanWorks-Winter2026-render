'use client'

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/globalComponents';
import { FileEdit } from 'lucide-react';
import { jobDescriptionApi } from './api';
import { JobDescriptionCard } from './JobDescriptionCard';
import { JobDescriptionWizard } from './JobDescriptionWizard';
import type { JobDescription } from '@/types';

export function JobPostingDraftsPage() {
    const [jobs, setJobs] = useState<JobDescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingJobId, setEditingJobId] = useState<string | null>(null);

    const fetchDrafts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await jobDescriptionApi.list({ status: 'draft' });
            setJobs(response.data.job_descriptions);
        } catch (error) {
            console.error('Failed to fetch drafts', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

    const handlePublish = async (id: string) => {
        try {
            await jobDescriptionApi.publish(id);
            fetchDrafts();
        } catch (error: any) {
            const errors = error.response?.data?.detail?.validation_errors;
            if (errors) {
                alert('Cannot publish:\n' + errors.join('\n'));
            } else {
                console.error('Failed to publish', error);
            }
        }
    };

    const handleDuplicate = async (id: string) => {
        try {
            await jobDescriptionApi.duplicate(id);
            fetchDrafts();
        } catch (error) {
            console.error('Failed to duplicate', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await jobDescriptionApi.delete(id);
            fetchDrafts();
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    // When editing, show the wizard instead of the list
    if (editingJobId) {
        return (
            <JobDescriptionWizard
                jobId={editingJobId}
                templateData={null}
                onComplete={() => { setEditingJobId(null); fetchDrafts(); }}
                onCancel={() => setEditingJobId(null)}
            />
        );
    }

    if (loading) {
        return <div className="text-center py-12 text-slate-500">Loading drafts...</div>;
    }

    if (jobs.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <FileEdit className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No drafts yet. Go to the Create Job Posting tab to get started.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <CardHeader className="px-0">
                <CardTitle>Job Posting Drafts ({jobs.length})</CardTitle>
            </CardHeader>
            <div className="space-y-3">
                {jobs.map((job) => (
                    <JobDescriptionCard
                        key={job.id}
                        job={job}
                        onEdit={() => setEditingJobId(job.id)}
                        onDuplicate={handleDuplicate}
                        onPublish={handlePublish}
                        onDelete={handleDelete}
                    />
                ))}
            </div>
        </div>
    );
}
