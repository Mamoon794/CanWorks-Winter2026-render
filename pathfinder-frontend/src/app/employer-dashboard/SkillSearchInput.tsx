'use client'

import { useState, useEffect, useRef } from 'react';
import { Input, Badge } from '@/app/components/globalComponents';
import { X, Search } from 'lucide-react';
import { skillApi } from './api';
import type { SkillOption } from '@/types';

interface SkillSearchInputProps {
    label: string;
    selectedSkills: { skill_id: string; skill_name: string }[];
    onAdd: (skill: { skill_id: string; skill_name: string }) => void;
    onRemove: (skillId: string) => void;
}

export function SkillSearchInput({ label, selectedSkills, onAdd, onRemove }: SkillSearchInputProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SkillOption[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced search: waits 300ms after the user stops typing before calling the API
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.length < 2) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            try {
                const response = await skillApi.search(query);
                const filtered = response.data.skills.filter(
                    (skill: SkillOption) => !selectedSkills.some(s => s.skill_id === skill.id)
                );
                setResults(filtered);
                setShowDropdown(filtered.length > 0);
            } catch {
                setResults([]);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, selectedSkills]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (skill: SkillOption) => {
        onAdd({ skill_id: skill.id, skill_name: skill.skill_name });
        setQuery('');
        setShowDropdown(false);
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>

            {/* Selected skills as removable badges */}
            {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {selectedSkills.map((skill) => (
                        <Badge key={skill.skill_id} variant="secondary" className="flex items-center gap-1 pr-1">
                            {skill.skill_name}
                            <button
                                type="button"
                                onClick={() => onRemove(skill.skill_id)}
                                className="ml-1 rounded-full hover:bg-slate-300 p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Search input with dropdown */}
            <div ref={wrapperRef} className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search skills..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
                        className="pl-9"
                    />
                </div>

                {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {results.map((skill) => (
                            <button
                                key={skill.id}
                                type="button"
                                onClick={() => handleSelect(skill)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center justify-between"
                            >
                                <span>{skill.skill_name}</span>
                                {skill.skill_category && (
                                    <span className="text-xs text-slate-400">{skill.skill_category}</span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
