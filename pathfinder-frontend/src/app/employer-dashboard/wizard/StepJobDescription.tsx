'use client'

import { Textarea, Label } from '@/app/components/globalComponents';
import type { JobDescriptionFormData } from '@/types';

interface StepJobDescriptionProps {
    formData: JobDescriptionFormData;
    updateField: <K extends keyof JobDescriptionFormData>(key: K, value: JobDescriptionFormData[K]) => void;
    errors: Record<string, string>;
}

export function StepJobDescription({ formData, updateField, errors }: StepJobDescriptionProps) {
    const charCount = formData.job_description.length;

    return (
        <div className="space-y-5">
            <h2 className="text-xl font-semibold">Job Description</h2>
            <p className="text-sm text-slate-500">
                Write a compelling overview of the role. Minimum 50 characters required to publish.
            </p>

            <div>
                <Label htmlFor="job_description">Description *</Label>
                <Textarea
                    id="job_description"
                    placeholder="Describe the role, team, and what makes this opportunity exciting..."
                    rows={8}
                    value={formData.job_description}
                    onChange={(e) => updateField('job_description', e.target.value)}
                />
                <div className="flex items-center justify-between mt-1">
                    <div>
                        {errors.job_description && (
                            <p className="text-sm text-red-500">{errors.job_description}</p>
                        )}
                    </div>
                    <p className={`text-xs ${charCount < 50 ? 'text-slate-400' : 'text-green-600'}`}>
                        {charCount} / 50 min
                    </p>
                </div>
            </div>
        </div>
    );
}
