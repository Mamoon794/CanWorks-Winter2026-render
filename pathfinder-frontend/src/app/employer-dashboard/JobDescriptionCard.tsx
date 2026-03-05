'use client'

import { Card, CardContent, Button, Badge,
    AlertDialog, AlertDialogTrigger, AlertDialogContent,
    AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
    AlertDialogFooter, AlertDialogAction, AlertDialogCancel
} from '@/app/components/globalComponents';
import { Pencil, Copy, Trash2, Send, XCircle } from 'lucide-react';
import type { JobDescription } from '@/types';

interface JobDescriptionCardProps {
    job: JobDescription;
    onEdit?: (id: string) => void;
    onDuplicate?: (id: string) => void;
    onDelete?: (id: string) => void;
    onPublish?: (id: string) => void;
    onUnpublish?: (id: string) => void;
}

export function JobDescriptionCard({ job, onEdit, onDuplicate, onDelete, onPublish, onUnpublish }: JobDescriptionCardProps) {
    const statusVariant = job.status === 'published' ? 'default' : 'secondary';
    const statusLabel = job.status === 'published' ? 'Published' : 'Draft';

    const formattedDate = job.updated_at
        ? new Date(job.updated_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
        : '—';

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    {/* Left side: job info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold truncate">{job.job_title}</h3>
                            <Badge variant={statusVariant}>{statusLabel}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                            {job.employment_type && <span>{job.employment_type}</span>}
                            {job.location_type && <span>{job.location_type}</span>}
                            {job.location_city && <span>{job.location_city}</span>}
                            <span>Updated {formattedDate}</span>
                        </div>
                        {job.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {job.skills.slice(0, 4).map((skill) => (
                                    <Badge key={skill.skill_id} variant="outline" className="text-xs">
                                        {skill.skill_name}
                                    </Badge>
                                ))}
                                {job.skills.length > 4 && (
                                    <Badge variant="outline" className="text-xs">+{job.skills.length - 4} more</Badge>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right side: action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                        {onEdit && (
                            <Button variant="ghost" size="icon" onClick={() => onEdit(job.id)} title="Edit">
                                <Pencil className="w-4 h-4" />
                            </Button>
                        )}
                        {onDuplicate && (
                            <Button variant="ghost" size="icon" onClick={() => onDuplicate(job.id)} title="Duplicate">
                                <Copy className="w-4 h-4" />
                            </Button>
                        )}
                        {onPublish && job.status === 'draft' && (
                            <Button variant="ghost" size="icon" onClick={() => onPublish(job.id)} title="Publish">
                                <Send className="w-4 h-4" />
                            </Button>
                        )}
                        {onUnpublish && job.status === 'published' && (
                            <Button variant="ghost" size="icon" onClick={() => onUnpublish(job.id)} title="Unpublish">
                                <XCircle className="w-4 h-4" />
                            </Button>
                        )}
                        {onDelete && (
                            <AlertDialog>
                                <AlertDialogTrigger>
                                    <Button variant="ghost" size="icon" title="Delete">
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Job Description</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete &quot;{job.job_title}&quot;? This action can be viewed in your History tab.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDelete(job.id)} className="bg-red-500 hover:bg-red-600">
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
