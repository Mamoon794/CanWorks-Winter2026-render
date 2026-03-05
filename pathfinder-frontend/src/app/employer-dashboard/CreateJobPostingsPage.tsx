'use client'

import { useState } from 'react';
import { Card, CardContent, Button } from '@/app/components/globalComponents';
import { PlusCircle, LayoutTemplate } from 'lucide-react';
import { TemplateSelector } from './TemplateSelector';
import { JobDescriptionWizard } from './JobDescriptionWizard';
import type { Template } from '@/types';

export function CreateJobPostingsPage() {
    const [view, setView] = useState<'choose' | 'wizard'>('choose');
    const [templateData, setTemplateData] = useState<Template | null>(null);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);

    const handleStartBlank = () => {
        setTemplateData(null);
        setView('wizard');
    };

    const handleSelectTemplate = (template: Template) => {
        setTemplateData(template);
        setShowTemplateSelector(false);
        setView('wizard');
    };

    const handleWizardComplete = () => {
        setView('choose');
        setTemplateData(null);
    };

    const handleWizardCancel = () => {
        setView('choose');
        setTemplateData(null);
    };

    if (view === 'wizard') {
        return (
            <JobDescriptionWizard
                jobId={null}
                templateData={templateData}
                onComplete={handleWizardComplete}
                onCancel={handleWizardCancel}
            />
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mt-8">
                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-slate-300"
                    onClick={handleStartBlank}
                >
                    <CardContent className="py-12 text-center">
                        <PlusCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Start from Scratch</h3>
                        <p className="text-sm text-slate-500">
                            Create a new job description using the step-by-step wizard.
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-slate-300"
                    onClick={() => setShowTemplateSelector(true)}
                >
                    <CardContent className="py-12 text-center">
                        <LayoutTemplate className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Start from Template</h3>
                        <p className="text-sm text-slate-500">
                            Choose a pre-built template to get started quickly.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <TemplateSelector
                open={showTemplateSelector}
                onClose={() => setShowTemplateSelector(false)}
                onSelect={handleSelectTemplate}
            />
        </>
    );
}
