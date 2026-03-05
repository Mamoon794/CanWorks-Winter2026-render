'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, Input, Label, Button, Badge,
    AlertDialog, AlertDialogContent, AlertDialogHeader,
    AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
    AlertDialogCancel
} from '@/app/components/globalComponents';
import { templateApi } from './api';
import type { Template } from '@/types';

interface TemplateSelectorProps {
    open: boolean;
    onClose: () => void;
    onSelect: (template: Template) => void;
}

export function TemplateSelector({ open, onClose, onSelect }: TemplateSelectorProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(false);
    const [industry, setIndustry] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [seniorityLevel, setSeniorityLevel] = useState('');

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (industry) params.industry = industry;
            if (jobTitle) params.job_title = jobTitle;
            if (seniorityLevel) params.seniority_level = seniorityLevel;
            const response = await templateApi.list(params);
            setTemplates(response.data.templates);
        } catch (error) {
            console.error('Failed to fetch templates', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) fetchTemplates();
    }, [open]);

    const handleSearch = () => {
        fetchTemplates();
    };

    return (
        <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
            <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle>Choose a Template</AlertDialogTitle>
                    <AlertDialogDescription>
                        Select a template to pre-fill your job description.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* Filter inputs */}
                <div className="grid grid-cols-3 gap-3 my-4">
                    <div>
                        <Label>Industry</Label>
                        <Input
                            placeholder="e.g. Technology"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Job Title</Label>
                        <Input
                            placeholder="e.g. Developer"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Seniority</Label>
                        <Input
                            placeholder="e.g. Junior"
                            value={seniorityLevel}
                            onChange={(e) => setSeniorityLevel(e.target.value)}
                        />
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleSearch}>
                    Search Templates
                </Button>

                {/* Template list */}
                <div className="space-y-3 mt-4">
                    {loading ? (
                        <p className="text-center text-slate-500 py-4">Loading templates...</p>
                    ) : templates.length === 0 ? (
                        <p className="text-center text-slate-500 py-4">No templates found.</p>
                    ) : (
                        templates.map((template) => (
                            <Card
                                key={template.id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => onSelect(template)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-semibold">{template.template_name}</h4>
                                            <p className="text-sm text-slate-500">
                                                {template.job_title} &middot; {template.industry} &middot; {template.seniority_level}
                                            </p>
                                        </div>
                                        <Badge variant="outline">{template.employment_type}</Badge>
                                    </div>
                                    {template.job_description && (
                                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">{template.job_description}</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
