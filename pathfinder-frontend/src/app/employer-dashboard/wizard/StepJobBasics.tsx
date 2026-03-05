'use client'

import { Input, Label } from '@/app/components/globalComponents';
import type { JobDescriptionFormData } from '@/types';

const SENIORITY_OPTIONS = ['Intern', 'Junior', 'Mid-Level', 'Senior', 'Lead', 'Manager', 'Director', 'Executive'];
const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Internship', 'Co-op'];
const LOCATION_TYPES = ['Remote', 'Hybrid', 'Onsite'];
const PROVINCES = [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
    'Newfoundland and Labrador', 'Nova Scotia', 'Ontario',
    'Prince Edward Island', 'Quebec', 'Saskatchewan',
    'Northwest Territories', 'Nunavut', 'Yukon',
];

interface StepJobBasicsProps {
    formData: JobDescriptionFormData;
    updateField: <K extends keyof JobDescriptionFormData>(key: K, value: JobDescriptionFormData[K]) => void;
    errors: Record<string, string>;
}

export function StepJobBasics({ formData, updateField, errors }: StepJobBasicsProps) {
    return (
        <div className="space-y-5">
            <h2 className="text-xl font-semibold">Job Basics</h2>

            {/* Job Title */}
            <div>
                <Label htmlFor="job_title">Job Title *</Label>
                <Input
                    id="job_title"
                    placeholder="e.g. Frontend Developer"
                    value={formData.job_title}
                    onChange={(e) => updateField('job_title', e.target.value)}
                />
                {errors.job_title && <p className="text-sm text-red-500 mt-1">{errors.job_title}</p>}
            </div>

            {/* Industry */}
            <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                    id="industry"
                    placeholder="e.g. Technology, Healthcare, Finance"
                    value={formData.industry}
                    onChange={(e) => updateField('industry', e.target.value)}
                />
            </div>

            {/* Job Function */}
            <div>
                <Label htmlFor="job_function">Job Function</Label>
                <Input
                    id="job_function"
                    placeholder="e.g. Engineering, Marketing, Operations"
                    value={formData.job_function}
                    onChange={(e) => updateField('job_function', e.target.value)}
                />
            </div>

            {/* Seniority Level */}
            <div>
                <Label htmlFor="seniority_level">Seniority Level</Label>
                <select
                    id="seniority_level"
                    value={formData.seniority_level}
                    onChange={(e) => updateField('seniority_level', e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                    <option value="">Select seniority level</option>
                    {SENIORITY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>

            {/* Employment Type */}
            <div>
                <Label htmlFor="employment_type">Employment Type</Label>
                <select
                    id="employment_type"
                    value={formData.employment_type}
                    onChange={(e) => updateField('employment_type', e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                    <option value="">Select employment type</option>
                    {EMPLOYMENT_TYPES.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>

            {/* Location Type */}
            <div>
                <Label htmlFor="location_type">Location Type</Label>
                <select
                    id="location_type"
                    value={formData.location_type}
                    onChange={(e) => updateField('location_type', e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                    <option value="">Select location type</option>
                    {LOCATION_TYPES.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>

            {/* City & Province (shown when not fully remote) */}
            {formData.location_type && formData.location_type !== 'Remote' && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="location_city">City</Label>
                        <Input
                            id="location_city"
                            placeholder="e.g. Toronto"
                            value={formData.location_city}
                            onChange={(e) => updateField('location_city', e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="location_province">Province</Label>
                        <select
                            id="location_province"
                            value={formData.location_province}
                            onChange={(e) => updateField('location_province', e.target.value)}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            <option value="">Select province</option>
                            {PROVINCES.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}
