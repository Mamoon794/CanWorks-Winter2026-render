'use client'

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/app/components/globalComponents';
import { Clock } from 'lucide-react';
import { jobDescriptionApi } from './api';
import { JobDescriptionCard } from './JobDescriptionCard';
import type { JobDescription } from '@/types';

export function JobPostingsHistoryPage() {
    const [jobs, setJobs] = useState<JobDescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'deleted' | 'expired'>('deleted');

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const params = view === 'deleted'
                ? { include_deleted: true }
                : { include_expired: true };
            const response = await jobDescriptionApi.list(params);
            setJobs(response.data.job_descriptions);
        } catch (error) {
            console.error('Failed to fetch history', error);
        } finally {
            setLoading(false);
        }
    }, [view]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const handleDuplicate = async (id: string) => {
        try {
            await jobDescriptionApi.duplicate(id);
            fetchHistory();
        } catch (error) {
            console.error('Failed to duplicate', error);
        }
    };

    return (
        <div className="space-y-4">
            <CardHeader className="px-0">
                <CardTitle>Job Postings History</CardTitle>
            </CardHeader>

            {/* Toggle between deleted and expired */}
            <div className="flex gap-2">
                <Button
                    variant={view === 'deleted' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setView('deleted')}
                >
                    Deleted
                </Button>
                <Button
                    variant={view === 'expired' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setView('expired')}
                >
                    Expired
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500">Loading history...</div>
            ) : jobs.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">
                            {view === 'deleted'
                                ? 'No deleted job postings.'
                                : 'No expired job postings.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {jobs.map((job) => (
                        <JobDescriptionCard
                            key={job.id}
                            job={job}
                            onDuplicate={handleDuplicate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
