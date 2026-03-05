'use client'

import { Input, Button, Label } from '@/app/components/globalComponents';
import { Plus, Trash2 } from 'lucide-react';
import type { JobDescriptionFormData } from '@/types';

interface StepResponsibilitiesProps {
    formData: JobDescriptionFormData;
    updateField: <K extends keyof JobDescriptionFormData>(key: K, value: JobDescriptionFormData[K]) => void;
    errors: Record<string, string>;
}

export function StepResponsibilities({ formData, updateField, errors }: StepResponsibilitiesProps) {
    const responsibilities = formData.responsibilities;

    const handleChange = (index: number, value: string) => {
        const updated = [...responsibilities];
        updated[index] = value;
        updateField('responsibilities', updated);
    };

    const handleAdd = () => {
        updateField('responsibilities', [...responsibilities, '']);
    };

    const handleRemove = (index: number) => {
        if (responsibilities.length <= 1) return; // Keep at least one
        const updated = responsibilities.filter((_, i) => i !== index);
        updateField('responsibilities', updated);
    };

    return (
        <div className="space-y-5">
            <h2 className="text-xl font-semibold">Responsibilities</h2>
            <p className="text-sm text-slate-500">
                List the key responsibilities for this role. At least one is required to publish.
            </p>

            <div className="space-y-3">
                <Label>Responsibilities *</Label>
                {responsibilities.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span className="text-sm text-slate-400 w-6 text-right">{index + 1}.</span>
                        <Input
                            placeholder="e.g. Design and implement RESTful APIs"
                            value={item}
                            onChange={(e) => handleChange(index, e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => handleRemove(index)}
                            disabled={responsibilities.length <= 1}
                            className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {errors.responsibilities && (
                    <p className="text-sm text-red-500">{errors.responsibilities}</p>
                )}

                <Button variant="outline" size="sm" onClick={handleAdd}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Responsibility
                </Button>
            </div>
        </div>
    );
}
