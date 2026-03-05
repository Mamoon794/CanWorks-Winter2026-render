'use client'

import { Card, CardContent, Badge } from '@/app/components/globalComponents';
import type { JobDescriptionFormData } from '@/types';

interface StepReviewSaveProps {
    formData: JobDescriptionFormData;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</h3>
            {children}
        </div>
    );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
    return (
        <div className="flex justify-between py-1">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-sm font-medium text-slate-800">{value || '—'}</span>
        </div>
    );
}

export function StepReviewSave({ formData }: StepReviewSaveProps) {
    const nonEmptyResponsibilities = formData.responsibilities.filter((r) => r.trim() !== '');

    return (
        <div className="space-y-5">
            <h2 className="text-xl font-semibold">Review Your Job Description</h2>
            <p className="text-sm text-slate-500">
                Review all the details below. Use &quot;Back&quot; to make changes, then &quot;Save Draft&quot; or &quot;Publish&quot;.
            </p>

            <Card>
                <CardContent className="p-5 space-y-6">
                    {/* Job Basics */}
                    <Section title="Job Basics">
                        <Field label="Job Title" value={formData.job_title} />
                        <Field label="Industry" value={formData.industry} />
                        <Field label="Job Function" value={formData.job_function} />
                        <Field label="Seniority" value={formData.seniority_level} />
                        <Field label="Employment Type" value={formData.employment_type} />
                        <Field label="Location Type" value={formData.location_type} />
                        {formData.location_type !== 'Remote' && (
                            <>
                                <Field label="City" value={formData.location_city} />
                                <Field label="Province" value={formData.location_province} />
                            </>
                        )}
                    </Section>

                    {/* Description */}
                    <Section title="Job Description">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                            {formData.job_description || '—'}
                        </p>
                    </Section>

                    {/* Responsibilities */}
                    <Section title="Responsibilities">
                        {nonEmptyResponsibilities.length > 0 ? (
                            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                                {nonEmptyResponsibilities.map((r, i) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-400">None added</p>
                        )}
                    </Section>

                    {/* Skills */}
                    <Section title="Skills">
                        <div className="space-y-2">
                            <div>
                                <span className="text-xs text-slate-500">Required:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {formData.required_skills.length > 0 ? (
                                        formData.required_skills.map((s) => (
                                            <Badge key={s.skill_id} variant="default">{s.skill_name}</Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-slate-400">None</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500">Preferred:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {formData.preferred_skills.length > 0 ? (
                                        formData.preferred_skills.map((s) => (
                                            <Badge key={s.skill_id} variant="outline">{s.skill_name}</Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-slate-400">None</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Qualifications & Compensation */}
                    <Section title="Qualifications & Compensation">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap mb-2">
                            {formData.qualifications || '—'}
                        </p>
                        <Field
                            label="Compensation"
                            value={
                                formData.compensation_min != null && formData.compensation_max != null
                                    ? `$${formData.compensation_min.toLocaleString()} – $${formData.compensation_max.toLocaleString()} ${formData.compensation_currency}`
                                    : undefined
                            }
                        />
                        <Field label="Application Deadline" value={formData.application_deadline} />
                    </Section>
                </CardContent>
            </Card>
        </div>
    );
}
