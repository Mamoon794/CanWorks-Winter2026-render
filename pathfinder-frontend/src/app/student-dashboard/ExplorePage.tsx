import React, { useState, useEffect } from 'react';
import { JobCard } from '@/app/components/JobCard';
import { Card, CheckBox, Label, Input, Button } from '@/app/components/globalComponents';
import { Search, Bell, BellRing, Mail } from 'lucide-react';
import type { SavedSearch, JobPosting} from '@/types';
import JobDetailsSidebar from '@/app/components/JobDetailsSidebar'; // <--- added import
import { useSavedJobs } from "@/app/hooks/useSavedJobs";

interface ExplorePageProps {
    jobs: JobPosting[];
    total: number;
}

export function ExplorePage({ jobs = [], total = 0 }: ExplorePageProps) {
    const { savedJobs, toggleSave } = useSavedJobs();
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null); // <--- added state
    const pageSize = 10;
    const [page, setPage] = useState(1);

    const [filters, setFilters] = useState({
        types: [] as ('intern' | 'coop' | 'new-grad' | 'part time' | 'full time')[],
        keywords: '',
        location: '',
        mode: [] as ('Remote' | 'On Site' | 'Hybrid')[],
        paymentTypes: [] as ('paid' | 'unpaid')[],
    });


    useEffect(() => {
        localStorage.setItem('savedJobs', JSON.stringify(Array.from(savedJobs)));
    }, [savedJobs]);

    useEffect(() => {
        localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
    }, [savedSearches]);


    const toggleType = (type: 'intern' | 'coop' | 'new-grad' | 'part time' | 'full time') => {
        setFilters(prev => ({
        ...prev,
        types: prev.types.includes(type)
            ? prev.types.filter(t => t !== type)
            : [...prev.types, type],
        }));
    };

    const toggleMode = (mode: 'Remote' | 'On Site' | 'Hybrid') => {
        setFilters(prev => ({
        ...prev,
        mode: prev.mode.includes(mode)
            ? prev.mode.filter(m => m !== mode)
            : [...prev.mode, mode],
        }));
    };

    const togglePaymentType = (paymentType: 'paid' | 'unpaid') => {
        setFilters(prev => ({
        ...prev,
        paymentTypes: prev.paymentTypes.includes(paymentType)
            ? prev.paymentTypes.filter(p => p !== paymentType)
            : [...prev.paymentTypes, paymentType],
        }));
    };

    const saveSearch = () => {
        const searchQuery = `${filters.keywords || 'All'} in ${filters.location || 'Any location'}`;
        const newSearch: SavedSearch = {
        id: Date.now().toString(),
        query: searchQuery,
        filters: {
            type: filters.types.length > 0 ? filters.types as ('internship' | 'coop' | 'new-grad')[] : undefined,
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
        if (filters.types.length > 0 && !filters.types.map(t => t.toLowerCase()).includes(job.job_type.toLowerCase())) return false;
        const jobLocation = `${job.city}, ${job.province}`.toLowerCase();
        if (filters.location && !jobLocation.includes(filters.location.toLowerCase())) return false;
        if (filters.mode.length > 0 && !filters.mode.includes(job.mode)) return false;
        if (filters.paymentTypes.length > 0) {
            const jobPaymentType = job.with_pay ? 'paid' : 'unpaid';
            if (!filters.paymentTypes.includes(jobPaymentType)) return false;
        }
        if (filters.keywords) {
        const keywords = filters.keywords.toLowerCase().split(',').map(k => k.trim());
        const jobText = `${job.title} ${job.employer} ${job.requirements || ''} ${job.responsibilities || ''} ${job.skills?.join(' ')}`.toLowerCase();
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
                            checked={filters.types.includes('intern')}
                            onChange={() => toggleType('intern')}
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
                        <div className="flex items-center space-x-2">
                        <CheckBox
                            id="filter-parttime"
                            checked={filters.types.includes('part time')}
                            onChange={() => toggleType('part time')}
                        />
                        <Label htmlFor="filter-parttime" className="cursor-pointer">Part Time</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                        <CheckBox
                            id="filter-fulltime"
                            checked={filters.types.includes('full time')}
                            onChange={() => toggleType('full time')}
                        />
                        <Label htmlFor="filter-fulltime" className="cursor-pointer">Full Time</Label>
                        </div>
                    </div>
                    </div>

                    <div className="space-y-3">
                    <Label>Work Mode</Label>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                        <CheckBox
                            id="filter-remote"
                            checked={filters.mode.includes('Remote')}
                            onChange={() => toggleMode('Remote')}
                        />
                        <Label htmlFor="filter-remote" className="cursor-pointer">Remote</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                        <CheckBox
                            id="filter-onsite"
                            checked={filters.mode.includes('On Site')}
                            onChange={() => toggleMode('On Site')}
                        />
                        <Label htmlFor="filter-onsite" className="cursor-pointer">On Site</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                        <CheckBox
                            id="filter-hybrid"
                            checked={filters.mode.includes('Hybrid')}
                            onChange={() => toggleMode('Hybrid')}
                        />
                        <Label htmlFor="filter-hybrid" className="cursor-pointer">Hybrid</Label>
                        </div>
                    </div>
                    </div>

                    <div className="space-y-3">
                    <Label>Payment Type</Label>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                        <CheckBox
                            id="filter-paid"
                            checked={filters.paymentTypes.includes('paid')}
                            onChange={() => togglePaymentType('paid')}
                        />
                        <Label htmlFor="filter-paid" className="cursor-pointer">Paid</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                        <CheckBox
                            id="filter-unpaid"
                            checked={filters.paymentTypes.includes('unpaid')}
                            onChange={() => togglePaymentType('unpaid')}
                        />
                        <Label htmlFor="filter-unpaid" className="cursor-pointer">Unpaid</Label>
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
                <div key={job.id} className="cursor-pointer" onClick={() => setSelectedJob(job)}>
                    <JobCard
                        job={job}
                        isSaved={savedJobs.has(job.id.toString())}
                        onToggleSave={toggleSave}
                    />
                </div>
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

        {/* Sidebar for job details */}
        <JobDetailsSidebar job={selectedJob} onClose={() => setSelectedJob(null)} />
        </div>
    );
}