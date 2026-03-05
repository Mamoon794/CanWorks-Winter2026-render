import React, { useState, useEffect } from 'react';
import { JobCard } from '@/app/components/JobCard';
import { Card, CheckBox, Label, Input, Button } from '@/app/components/globalComponents';
import { Search, Bell, BellRing, Mail } from 'lucide-react';
import type { SavedSearch, JobPosting} from '@/types';
import { useSavedJobs } from "@/app/hooks/useSavedJobs";

interface ExplorePageProps {
    jobs: JobPosting[];
    total: number;
}

export function ExplorePage({ jobs = [], total = 0 }: ExplorePageProps) {
    const { savedJobs, toggleSave } = useSavedJobs();
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const pageSize = 10;
    const [page, setPage] = useState(1);

    const [filters, setFilters] = useState({
        types: [] as ('internship' | 'coop' | 'new-grad')[],
        keywords: '',
        location: '',
        mode: [] as ('Remote' | 'On Site' | 'Hybrid')[],
    });


    useEffect(() => {
        localStorage.setItem('savedJobs', JSON.stringify(Array.from(savedJobs)));
    }, [savedJobs]);

    useEffect(() => {
        localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
    }, [savedSearches]);


    const toggleType = (type: 'internship' | 'coop' | 'new-grad') => {
        setFilters(prev => ({
        ...prev,
        types: prev.types.includes(type)
            ? prev.types.filter(t => t !== type)
            : [...prev.types, type],
        }));
    };

    const saveSearch = () => {
        const searchQuery = `${filters.keywords || 'All'} in ${filters.location || 'Any location'}`;
        const newSearch: SavedSearch = {
        id: Date.now().toString(),
        query: searchQuery,
        filters: {
            type: filters.types.length > 0 ? filters.types : undefined,
            location: filters.location || undefined,
            keywords: filters.keywords ? filters.keywords.split(',').map(k => k.trim()) : undefined,
        },
        alertEnabled: false,
        createdAt: new Date(),
        };
        setSavedSearches(prev => [...prev, newSearch]);
    };

    const toggleAlert = (searchId: string) => {
        setSavedSearches(prev =>
        prev.map(s => s.id === searchId ? { ...s, alertEnabled: !s.alertEnabled } : s)
        );
    };

    const filteredJobs = jobs.filter(job => {
        if (filters.types.length > 0 && !filters.types.includes(job.job_type)) return false;
        const jobLocation = `${job.city}, ${job.province}`.toLowerCase();
        if (filters.location && !jobLocation.includes(filters.location.toLowerCase())) return false;
        const jobMode = job.mode.toLowerCase();
        if (filters.mode.length > 0 && !filters.mode.some(m => jobMode.includes(m.toLowerCase()))) return false;
        if (filters.keywords) {
        const keywords = filters.keywords.toLowerCase().split(',').map(k => k.trim());
        const jobText = `${job.title} ${job.description} ${job.skills?.join(' ')}`.toLowerCase();
        if (!keywords.some(keyword => jobText.includes(keyword))) return false;
        }
        return true;
    });

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:col-span-1 space-y-6">
            <Card className="p-6 space-y-6">
                <div>
                <h3 className="mb-4">Filters</h3>

                <div className="space-y-4">
                    <div className="space-y-3">
                    <Label>Job Type</Label>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                        <CheckBox
                            id="filter-internship"
                            checked={filters.types.includes('internship')}
                            onChange={() => toggleType('internship')}
                        />
                        <Label htmlFor="filter-internship" className="cursor-pointer">Internship</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                        <CheckBox
                            id="filter-coop"
                            checked={filters.types.includes('coop')}
                            onChange={() => toggleType('coop')}
                        />
                        <Label htmlFor="filter-coop" className="cursor-pointer">Co-op</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                        <CheckBox
                            id="filter-newgrad"
                            checked={filters.types.includes('new-grad')}
                            onChange={() => toggleType('new-grad')}
                        />
                        <Label htmlFor="filter-newgrad" className="cursor-pointer">New Grad</Label>
                        </div>
                    </div>
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="keywords">Keyword Search</Label>
                    <Input
                        id="keywords"
                        value={filters.keywords}
                        onChange={(e) => setFilters({ ...filters, keywords: e.target.value })}
                        placeholder="Skills, keywords"
                    />
                    <p className="text-xs text-gray-500">Separate with commas</p>
                    </div>

                    <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                        id="location"
                        value={filters.location}
                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                        placeholder="City, state"
                    />
                    </div>

                    <Button onClick={saveSearch} variant="outline" className="w-full" size="sm">
                    <Bell className="w-4 h-4 mr-2" />
                    Save This Search
                    </Button>
                </div>
                </div>
            </Card>

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
                <Card className="p-6">
                <h3 className="mb-4">Saved Searches</h3>
                <div className="space-y-3">
                    {savedSearches.map(search => (
                    <div key={search.id} className="text-sm space-y-2">
                        <p className="text-gray-700">{search.query}</p>
                        <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => toggleAlert(search.id)}
                        >
                        {search.alertEnabled ? (
                            <>
                            <BellRing className="w-4 h-4 mr-2 text-green-600" />
                            <span className="text-green-600">Alert On</span>
                            </>
                        ) : (
                            <>
                            <Bell className="w-4 h-4 mr-2" />
                            Enable Alert
                            </>
                        )}
                        </Button>
                    </div>
                    ))}
                </div>
                </Card>
            )}

            {/* Email Startups */}
            <Card className="p-6">
                <h3 className="mb-3">Email Startups</h3>
                <p className="text-sm text-gray-600 mb-4">
                Send your profile to hiring managers at selected startups
                </p>
                <Button variant="outline" size="sm" className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                Email Feature
                </Button>
            </Card>
            </aside>

            {/* Job Listings */}
            <main className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl">
                {filteredJobs.length} Job{filteredJobs.length !== 1 ? 's' : ''} Found
                </h2>
            </div>

            <div className="space-y-4">
                {filteredJobs.map(job => (
                <JobCard
                    key={job.id}
                    job={job}
                    isSaved={savedJobs.has(job.id.toString())}
                    onToggleSave={toggleSave}
                />
                ))}
            </div>

            {filteredJobs.length === 0 && (
                <Card className="p-12 text-center">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg mb-2">No jobs found</h3>
                <p className="text-gray-600">Try adjusting your filters to see more results</p>
                </Card>
            )}
            </main>
        </div>
        </div>
    );
}