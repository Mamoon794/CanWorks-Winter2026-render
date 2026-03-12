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

    // Fetch skills from the API filtering by query (empty query returns all skills)
    const fetchSkills = async (searchQuery: string) => {
        try {
            const response = await skillApi.search(searchQuery);
            const filtered = response.data.skills.filter(
                (skill: SkillOption) => !selectedSkills.some(s => s.skill_id === skill.id)
            );
            setResults(filtered);
            setShowDropdown(true);
        } catch {
            setResults([]);
            setShowDropdown(true);
        }
    };

    // Debounced search: waits 300ms after the user stops typing before calling the API
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            fetchSkills(query);
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

    const [isCreating, setIsCreating] = useState(false);

    const handleSelect = (skill: SkillOption) => {
        onAdd({ skill_id: skill.id, skill_name: skill.skill_name });
        setQuery('');
        setShowDropdown(false);
    };

    const handleCreateCustomSkill = async () => {
        const trimmed = query.trim();
        if (!trimmed || isCreating) return;

        setIsCreating(true);
        try {
            const response = await skillApi.create(trimmed);
            const newSkill = response.data;
            onAdd({ skill_id: newSkill.id, skill_name: newSkill.skill_name });
            setQuery('');
            setShowDropdown(false);
        } catch (err: unknown) {
            // If skill already exists (409), search again to find it
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { status?: number } };
                if (axiosErr.response?.status === 409) {
                    const response = await skillApi.search(trimmed);
                    const match = response.data.skills.find(
                        (s: SkillOption) => s.skill_name.toLowerCase() === trimmed.toLowerCase()
                    );
                    if (match) {
                        onAdd({ skill_id: match.id, skill_name: match.skill_name });
                        setQuery('');
                        setShowDropdown(false);
                    }
                }
            }
        } finally {
            setIsCreating(false);
        }
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
                        onFocus={() => {
                            if (results.length > 0) {
                                setShowDropdown(true);
                            } else {
                                fetchSkills(query);
                            }
                        }}
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
                        {results.length === 0 && query.trim().length >= 2 && (
                            <button
                                type="button"
                                onClick={handleCreateCustomSkill}
                                disabled={isCreating}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 flex items-center justify-between text-blue-600"
                            >
                                <span>{isCreating ? 'Adding...' : `Add "${query.trim()}" as a custom skill`}</span>
                                <span className="text-xs text-slate-400">Custom</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
