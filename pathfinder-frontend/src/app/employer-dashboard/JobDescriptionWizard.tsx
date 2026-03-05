'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/globalComponents';
import { jobDescriptionApi } from './api';
import { WizardStepIndicator } from './wizard/WizardStepIndicator';
import { StepJobBasics } from './wizard/StepJobBasics';
import { StepJobDescription } from './wizard/StepJobDescription';
import { StepResponsibilities } from './wizard/StepResponsibilities';
import { StepSkillsSelection } from './wizard/StepSkillsSelection';
import { StepQualifications } from './wizard/StepQualifications';
import { StepReviewSave } from './wizard/StepReviewSave';
import type { JobDescriptionFormData, Template } from '@/types';

const STEP_LABELS = [
    'Job Basics',
    'Description',
    'Responsibilities',
    'Skills',
    'Qualifications',
    'Review',
];

const EMPTY_FORM: JobDescriptionFormData = {
    job_title: '',
    industry: '',
    job_function: '',
    seniority_level: '',
    employment_type: '',
    location_type: '',
    location_city: '',
    location_province: '',
    job_description: '',
    responsibilities: [''],
    required_skills: [],
    preferred_skills: [],
    qualifications: '',
    compensation_min: null,
    compensation_max: null,
    compensation_currency: 'CAD',
    application_deadline: '',
};

interface JobDescriptionWizardProps {
    jobId: string | null;
    templateData: Template | null;
    onComplete: () => void;
    onCancel: () => void;
}

export function JobDescriptionWizard({ jobId, templateData, onComplete, onCancel }: JobDescriptionWizardProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<JobDescriptionFormData>({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [savedJobId, setSavedJobId] = useState<string | null>(jobId);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Pre-populate from existing job description (editing)
    useEffect(() => {
        if (jobId) {
            jobDescriptionApi.get(jobId).then((res) => {
                const job = res.data;
                setFormData({
                    job_title: job.job_title || '',
                    industry: job.industry || '',
                    job_function: job.job_function || '',
                    seniority_level: job.seniority_level || '',
                    employment_type: job.employment_type || '',
                    location_type: job.location_type || '',
                    location_city: job.location_city || '',
                    location_province: job.location_province || '',
                    job_description: job.job_description || '',
                    responsibilities: job.responsibilities?.length ? job.responsibilities : [''],
                    required_skills: (job.skills || [])
                        .filter((s: any) => s.skill_type === 'required')
                        .map((s: any) => ({ skill_id: s.skill_id, skill_name: s.skill_name })),
                    preferred_skills: (job.skills || [])
                        .filter((s: any) => s.skill_type === 'preferred')
                        .map((s: any) => ({ skill_id: s.skill_id, skill_name: s.skill_name })),
                    qualifications: job.qualifications || '',
                    compensation_min: job.compensation_min,
                    compensation_max: job.compensation_max,
                    compensation_currency: job.compensation_currency || 'CAD',
                    application_deadline: job.application_deadline || '',
                });
            });
        }
    }, [jobId]);

    // Pre-populate from template
    useEffect(() => {
        if (templateData && !jobId) {
            setFormData({
                ...EMPTY_FORM,
                job_title: templateData.job_title || '',
                industry: templateData.industry || '',
                seniority_level: templateData.seniority_level || '',
                employment_type: templateData.employment_type || '',
                location_city: templateData.city || '',
                location_province: templateData.province || '',
                job_description: templateData.job_description || '',
                responsibilities: templateData.responsibilities?.length ? templateData.responsibilities : [''],
                qualifications: templateData.qualifications || '',
                compensation_min: templateData.compensation_min,
                compensation_max: templateData.compensation_max,
            });
        }
    }, [templateData, jobId]);

    const updateField = <K extends keyof JobDescriptionFormData>(key: K, value: JobDescriptionFormData[K]) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
        // Clear error for that field when user edits it
        if (errors[key]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    // Transform formData into the shape the API expects
    const buildPayload = () => {
        const skills = [
            ...formData.required_skills.map((s) => ({ skill_id: s.skill_id, skill_type: 'required' as const })),
            ...formData.preferred_skills.map((s) => ({ skill_id: s.skill_id, skill_type: 'preferred' as const })),
        ];

        return {
            job_title: formData.job_title || undefined,
            industry: formData.industry || undefined,
            job_function: formData.job_function || undefined,
            seniority_level: formData.seniority_level || undefined,
            employment_type: formData.employment_type || undefined,
            location_type: formData.location_type || undefined,
            location_city: formData.location_city || undefined,
            location_province: formData.location_province || undefined,
            job_description: formData.job_description || undefined,
            responsibilities: formData.responsibilities.filter((r) => r.trim() !== ''),
            qualifications: formData.qualifications || undefined,
            compensation_min: formData.compensation_min,
            compensation_max: formData.compensation_max,
            compensation_currency: formData.compensation_currency,
            application_deadline: formData.application_deadline || undefined,
            skills: skills.length > 0 ? skills : undefined,
        };
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            const payload = buildPayload();
            if (savedJobId) {
                await jobDescriptionApi.update(savedJobId, payload);
            } else {
                const res = await jobDescriptionApi.create(payload);
                setSavedJobId(res.data.id);
            }
            alert('Draft saved!');
        } catch (error) {
            console.error('Failed to save draft', error);
            alert('Failed to save draft. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        setSaving(true);
        try {
            const payload = buildPayload();
            // Save first, then publish
            if (savedJobId) {
                await jobDescriptionApi.update(savedJobId, payload);
            } else {
                const res = await jobDescriptionApi.create(payload);
                setSavedJobId(res.data.id);
            }
            // Now publish — the id is guaranteed to exist
            const idToPublish = savedJobId || (await jobDescriptionApi.create(payload)).data.id;
            await jobDescriptionApi.publish(idToPublish);
            alert('Job description published!');
            onComplete();
        } catch (error: any) {
            const validationErrors = error.response?.data?.detail?.validation_errors;
            if (validationErrors) {
                alert('Cannot publish:\n' + validationErrors.join('\n'));
            } else {
                console.error('Failed to publish', error);
                alert('Failed to publish. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    const renderStep = () => {
        const stepProps = { formData, updateField, errors };

        switch (currentStep) {
            case 1: return <StepJobBasics {...stepProps} />;
            case 2: return <StepJobDescription {...stepProps} />;
            case 3: return <StepResponsibilities {...stepProps} />;
            case 4: return <StepSkillsSelection {...stepProps} />;
            case 5: return <StepQualifications {...stepProps} />;
            case 6: return <StepReviewSave formData={formData} />;
            default: return null;
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <WizardStepIndicator
                currentStep={currentStep}
                stepLabels={STEP_LABELS}
            />

            <div className="min-h-[300px]">
                {renderStep()}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    {currentStep > 1 && (
                        <Button variant="outline" onClick={() => setCurrentStep((s) => s - 1)}>
                            Back
                        </Button>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Draft'}
                    </Button>

                    {currentStep < 6 ? (
                        <Button onClick={() => setCurrentStep((s) => s + 1)}>
                            Next
                        </Button>
                    ) : (
                        <Button onClick={handlePublish} disabled={saving}>
                            {saving ? 'Publishing...' : 'Publish'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
