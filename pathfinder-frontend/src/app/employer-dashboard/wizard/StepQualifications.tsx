'use client'

import { Textarea, Input, Label } from '@/app/components/globalComponents';
import type { JobDescriptionFormData } from '@/types';

interface StepQualificationsProps {
    formData: JobDescriptionFormData;
    updateField: <K extends keyof JobDescriptionFormData>(key: K, value: JobDescriptionFormData[K]) => void;
    errors: Record<string, string>;
}

export function StepQualifications({ formData, updateField, errors }: StepQualificationsProps) {
    return (
        <div className="space-y-5">
            <h2 className="text-xl font-semibold">Qualifications & Compensation</h2>

            {/* Qualifications */}
            <div>
                <Label htmlFor="qualifications">Qualifications</Label>
                <Textarea
                    id="qualifications"
                    placeholder="e.g. Bachelor's degree in Computer Science or related field, 2+ years of experience..."
                    rows={5}
                    value={formData.qualifications}
                    onChange={(e) => updateField('qualifications', e.target.value)}
                />
            </div>

            {/* Compensation */}
            <div>
                <Label>Compensation (CAD) *</Label>
                <div className="grid grid-cols-2 gap-4 mt-1">
                    <div>
                        <Input
                            type="number"
                            placeholder="Min (e.g. 50000)"
                            value={formData.compensation_min ?? ''}
                            onChange={(e) =>
                                updateField('compensation_min', e.target.value ? Number(e.target.value) : null)
                            }
                        />
                        {errors.compensation_min && (
                            <p className="text-sm text-red-500 mt-1">{errors.compensation_min}</p>
                        )}
                    </div>
                    <div>
                        <Input
                            type="number"
                            placeholder="Max (e.g. 80000)"
                            value={formData.compensation_max ?? ''}
                            onChange={(e) =>
                                updateField('compensation_max', e.target.value ? Number(e.target.value) : null)
                            }
                        />
                        {errors.compensation_max && (
                            <p className="text-sm text-red-500 mt-1">{errors.compensation_max}</p>
                        )}
                    </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                    Both minimum and maximum are required to publish.
                </p>
            </div>

            {/* Application Deadline */}
            <div>
                <Label htmlFor="application_deadline">Application Deadline</Label>
                <Input
                    id="application_deadline"
                    type="date"
                    value={formData.application_deadline}
                    onChange={(e) => updateField('application_deadline', e.target.value)}
                />
            </div>
        </div>
    );
}
