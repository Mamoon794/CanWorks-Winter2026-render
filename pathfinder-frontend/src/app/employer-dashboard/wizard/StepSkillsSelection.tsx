'use client'

import { SkillSearchInput } from '../SkillSearchInput';
import type { JobDescriptionFormData } from '@/types';

interface StepSkillsSelectionProps {
    formData: JobDescriptionFormData;
    updateField: <K extends keyof JobDescriptionFormData>(key: K, value: JobDescriptionFormData[K]) => void;
    errors: Record<string, string>;
}

export function StepSkillsSelection({ formData, updateField, errors }: StepSkillsSelectionProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Skills</h2>
            <p className="text-sm text-slate-500">
                Search and add the skills required for this role. At least one required skill is needed to publish.
            </p>

            {/* Required Skills */}
            <SkillSearchInput
                label="Required Skills *"
                selectedSkills={formData.required_skills}
                onAdd={(skill) => updateField('required_skills', [...formData.required_skills, skill])}
                onRemove={(id) => updateField('required_skills', formData.required_skills.filter((s) => s.skill_id !== id))}
            />
            {errors.required_skills && (
                <p className="text-sm text-red-500">{errors.required_skills}</p>
            )}

            {/* Preferred / Good-to-Have Skills */}
            <SkillSearchInput
                label="Preferred Skills (Good to Have)"
                selectedSkills={formData.preferred_skills}
                onAdd={(skill) => updateField('preferred_skills', [...formData.preferred_skills, skill])}
                onRemove={(id) => updateField('preferred_skills', formData.preferred_skills.filter((s) => s.skill_id !== id))}
            />
        </div>
    );
}
