'use client'

import { Check } from 'lucide-react';

interface WizardStepIndicatorProps {
    currentStep: number;
    stepLabels: string[];
}

export function WizardStepIndicator({ currentStep, stepLabels }: WizardStepIndicatorProps) {
    return (
        <div className="flex items-center justify-between">
            {stepLabels.map((label, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < currentStep;
                const isCurrent = stepNumber === currentStep;

                return (
                    <div key={label} className="flex items-center flex-1 last:flex-none">
                        {/* Step circle + label */}
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                                    isCompleted
                                        ? 'bg-slate-800 border-slate-800 text-white'
                                        : isCurrent
                                          ? 'border-slate-800 text-slate-800 bg-white'
                                          : 'border-slate-300 text-slate-400 bg-white'
                                }`}
                            >
                                {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
                            </div>
                            <span
                                className={`text-xs mt-1 whitespace-nowrap ${
                                    isCurrent ? 'text-slate-800 font-medium' : 'text-slate-400'
                                }`}
                            >
                                {label}
                            </span>
                        </div>

                        {/* Connector line (not after the last step) */}
                        {stepNumber < stepLabels.length && (
                            <div
                                className={`flex-1 h-0.5 mx-2 mt-[-16px] ${
                                    isCompleted ? 'bg-slate-800' : 'bg-slate-200'
                                }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
