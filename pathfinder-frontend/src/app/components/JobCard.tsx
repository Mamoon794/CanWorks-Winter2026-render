import React from 'react';
import { Card, Badge, Button } from '@/app/components/globalComponents';
import { ExternalLink, Bookmark, BookmarkCheck, MapPin, Award } from 'lucide-react';
import type { JobPosting } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import fastAxiosInstance from '@/axiosConfig/axiosfig';

interface JobCardProps {
  job: JobPosting;
  isSaved: boolean;
  onToggleSave: (jobId: string) => void;
}

export function JobCard({ job, isSaved, onToggleSave }: JobCardProps) {
    const typeColors = {
        'intern': 'bg-blue-100 text-blue-700',
        'coop': 'bg-purple-100 text-purple-700',
        'new-grad': 'bg-green-100 text-green-700',
        'part time': 'bg-orange-100 text-orange-700',
        'full time': 'bg-indigo-100 text-indigo-700',
    };

    return (
        <Card className="p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
            <div>
                <h3 className="text-lg mb-1">{job.title}</h3>
                <p className="text-gray-600">{job.employer}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.city && job.province ? `${job.city}, ${job.province}` : job.city || job.province || 'Remote'}
                </div>
                {job.coopCredits && (
                <div className="flex items-center gap-1 text-purple-600">
                    <Award className="w-4 h-4" />
                    {job.coopCredits} credits
                </div>
                )}
            </div>

            <p className="text-sm text-gray-700 line-clamp-2">{job.description}</p>

            <div className="flex flex-wrap gap-2">
                {job.job_type && (
                    <Badge className={typeColors[job.job_type]}>
                    {job.job_type === 'new-grad' ? 'New Grad' : 
                     job.job_type === 'part time' ? 'Part Time' :
                     job.job_type === 'full time' ? 'Full Time' :
                     job.job_type === 'intern' ? 'Internship' :
                     job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1)}
                    </Badge>
                )}
                {job.skills?.slice(0, 3).map(skill => (
                <Badge key={skill} variant="outline">{skill}</Badge>
                ))}
                {job.skills && job.skills.length > 3 && (
                <Badge variant="outline">+{job.skills.length - 3} more</Badge>
                )}
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500">
                {job.posting_date && <span>Posted {formatDistanceToNow(new Date(job.posting_date), { addSuffix: true })}</span>}
            </div>
            </div>

            <div className="flex flex-col gap-2">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleSave(job.id.toString())}
                className="shrink-0"
            >
                {isSaved ? (
                <BookmarkCheck className="w-5 h-5 text-blue-600" />
                ) : (
                <Bookmark className="w-5 h-5" />
                )}
            </Button>

            <Button
                size="sm"
                asChild
                className="shrink-0"
            >
                <a
                    href={job.link_to_posting || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                    onClick={() => {
                        fastAxiosInstance.post('/api/track-click', {
                            job_id: Number(job.id) || null,
                            job_type: job.job_type || null,
                            url: job.link_to_posting || '',
                        }).catch(() => {});
                    }}
                >
                <ExternalLink className="w-4 h-4" />
                {job.applySite}
                </a>
            </Button>
            </div>
        </div>
        </Card>
    );
}
