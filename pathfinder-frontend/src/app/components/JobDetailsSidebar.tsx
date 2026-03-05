import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import type { JobPosting } from '@/types';

interface Props {
    job: JobPosting | null;
    onClose: () => void;
}

export default function JobDetailsSidebar({ job, onClose }: Props) {
    if (!job) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex"
            role="dialog"
            aria-modal="true"
        >
            {/* overlay */}
            <div
                className="fixed inset-0 bg-transparent z-40" // no darkening; sits under the panel
                onClick={onClose}
            />

            {/* panel */}
            <aside
                className="ml-auto w-full max-w-md bg-white shadow-xl overflow-y-auto transform transition-transform duration-200 z-50 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold line-clamp-2">{job.title}</h3>
                        <p className="text-sm text-gray-500">{job.employer} — {job.city}, {job.province}</p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="p-2 rounded hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="space-y-1">
                        <h4 className="text-sm text-gray-600">Job Type</h4>
                        <p className="text-sm">{job.job_type} · {job.mode}</p>
                    </div>

                    <div>
                        <h4 className="text-sm text-gray-600">Description</h4>
                        <p className="prose text-sm max-w-none whitespace-pre-wrap">{job.description || 'No description available.'}</p>
                    </div>

                    {job.skills && job.skills.length > 0 && (
                        <div>
                            <h4 className="text-sm text-gray-600">Skills</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {job.skills.map(s => (
                                    <span key={s} className="px-3 py-1 bg-gray-100 rounded-full text-sm">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-2 border-t flex items-center justify-between">
                        <div className="text-sm text-gray-500">Posted: {job.posting_date ? new Date(job.posting_date).toLocaleDateString() : 'Unknown'}</div>
                        <a
                            href={job.link_to_posting || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm"
                        >
                            <ExternalLink className="w-4 h-4" />
                            View Posting
                        </a>
                    </div>
                </div>
            </aside>
        </div>
    );
}