import React, { useState, useEffect, useRef } from 'react';
import { JobCard } from '@/app/components/JobCard';
import { Card, CheckBox, Label, Input, Button, Badge } from '@/app/components/globalComponents';
import { Search, Bell, BellRing, Mail, MapPin, Briefcase, Send, X, FileText, Upload } from 'lucide-react';
import type { SavedSearch, JobPosting, JobDescription, StudentUserData } from '@/types';
import JobDetailsSidebar from '@/app/components/JobDetailsSidebar';
import { useSavedJobs } from "@/app/hooks/useSavedJobs";
import { useUser } from '@/app/components/authComponents';
import fastAxiosInstance from '@/axiosConfig/axiosfig';

interface ExplorePageProps {
    jobs: JobPosting[];
    total: number;
}

// Employer job detail sidebar
function EmployerJobDetailSidebar({
    job,
    onClose,
    onApply,
    applied,
}: {
    job: JobDescription | null;
    onClose: () => void;
    onApply: (jobId: string) => void;
    applied: boolean;
}) {
    if (!job) return null;

    return (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-transparent z-40" onClick={onClose} />
            <aside
                className="ml-auto w-full max-w-md bg-white shadow-xl overflow-y-auto transform transition-transform duration-200 z-50 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold line-clamp-2">{job.job_title}</h3>
                        <p className="text-sm text-gray-500">
                            {[job.location_city, job.location_province].filter(Boolean).join(', ') || 'Location not specified'}
                        </p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="p-2 rounded hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {job.employment_type && <Badge>{job.employment_type}</Badge>}
                        {job.location_type && <Badge variant="secondary">{job.location_type}</Badge>}
                        {job.seniority_level && <Badge variant="secondary">{job.seniority_level}</Badge>}
                    </div>

                    {job.industry && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-600">Industry</h4>
                            <p className="text-sm">{job.industry}</p>
                        </div>
                    )}

                    {job.job_function && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-600">Job Function</h4>
                            <p className="text-sm">{job.job_function}</p>
                        </div>
                    )}

                    <div>
                        <h4 className="text-sm font-medium text-gray-600">Description</h4>
                        <p className="prose text-sm max-w-none whitespace-pre-wrap">
                            {job.job_description || 'No description available.'}
                        </p>
                    </div>

                    {job.responsibilities && job.responsibilities.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-600">Responsibilities</h4>
                            <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                                {job.responsibilities.map((r, i) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {job.qualifications && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-600">Qualifications</h4>
                            <p className="text-sm whitespace-pre-wrap">{job.qualifications}</p>
                        </div>
                    )}

                    {job.skills && job.skills.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-600">Skills</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {job.skills.map((s) => (
                                    <span
                                        key={s.skill_id}
                                        className={`px-3 py-1 rounded-full text-sm ${
                                            s.skill_type === 'required'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {s.skill_name}
                                        <span className="text-xs ml-1 opacity-70">
                                            ({s.skill_type})
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {(job.compensation_min != null || job.compensation_max != null) && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-600">Compensation</h4>
                            <p className="text-sm">
                                {job.compensation_min != null && job.compensation_max != null
                                    ? `$${job.compensation_min.toLocaleString()} - $${job.compensation_max.toLocaleString()} ${job.compensation_currency}`
                                    : job.compensation_min != null
                                    ? `From $${job.compensation_min.toLocaleString()} ${job.compensation_currency}`
                                    : `Up to $${job.compensation_max!.toLocaleString()} ${job.compensation_currency}`}
                            </p>
                        </div>
                    )}

                    {job.application_deadline && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-600">Application Deadline</h4>
                            <p className="text-sm">{new Date(job.application_deadline).toLocaleDateString()}</p>
                        </div>
                    )}

                    <div className="pt-4 border-t">
                        {applied ? (
                            <Button variant="outline" className="w-full" disabled>
                                Already Applied
                            </Button>
                        ) : (
                            <Button className="w-full" onClick={() => onApply(job.id)}>
                                <Send className="w-4 h-4 mr-2" />
                                Apply Now
                            </Button>
                        )}
                    </div>
                </div>
            </aside>
        </div>
    );
}

// Application form modal
function ApplicationModal({
    job,
    user,
    onClose,
    onSuccess,
}: {
    job: JobDescription;
    user: { email: string; userData: StudentUserData };
    onClose: () => void;
    onSuccess: (jobId: string) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        student_name: user.email?.split('@')[0] || '',
        student_email: user.email || '',
        university: user.userData?.university || '',
        major: user.userData?.major || '',
        graduation_year: user.userData?.graduationYear || '',
        relevant_experience: '',
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            setError('Resume must be a PDF file');
            e.target.value = '';
            return;
        }
        setError(null);
        setResumeFile(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resumeFile) {
            setError('Please upload your resume (PDF)');
            return;
        }
        setSubmitting(true);
        setError(null);

        try {
            const data = new FormData();
            data.append('job_description_id', job.id);
            data.append('student_name', formData.student_name);
            data.append('student_email', formData.student_email);
            data.append('university', formData.university);
            data.append('major', formData.major);
            data.append('graduation_year', formData.graduation_year);
            data.append('relevant_experience', formData.relevant_experience);
            data.append('resume', resumeFile);

            await fastAxiosInstance.post('/api/applications', data);
            onSuccess(job.id);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { detail?: string } } };
            setError(axiosErr.response?.data?.detail || 'Failed to submit application');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            <div
                className="relative z-50 bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Apply to {job.job_title}</h2>
                        <p className="text-sm text-gray-500">Fill in your details to apply</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="app-name">Full Name</Label>
                            <Input
                                id="app-name"
                                value={formData.student_name}
                                onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="app-email">Email</Label>
                            <Input
                                id="app-email"
                                type="email"
                                value={formData.student_email}
                                onChange={(e) => setFormData({ ...formData, student_email: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="app-university">University</Label>
                            <Input
                                id="app-university"
                                value={formData.university}
                                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="app-major">Major</Label>
                            <Input
                                id="app-major"
                                value={formData.major}
                                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="app-gradyear">Graduation Year</Label>
                        <Input
                            id="app-gradyear"
                            value={formData.graduation_year}
                            onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                            placeholder="e.g. 2026"
                        />
                    </div>

                    <div>
                        <Label>Resume (PDF only) <span className="text-red-500">*</span></Label>
                        <div
                            className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            {resumeFile ? (
                                <div className="flex items-center justify-center gap-2 text-sm text-green-700">
                                    <FileText className="w-5 h-5" />
                                    {resumeFile.name}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <Upload className="w-6 h-6 mx-auto text-gray-400" />
                                    <p className="text-sm text-gray-500">Click to upload your resume</p>
                                    <p className="text-xs text-gray-400">PDF files only</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Application'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function ExplorePage({ jobs = [], total = 0 }: ExplorePageProps) {
    const { savedJobs, toggleSave } = useSavedJobs();
    const { user } = useUser<'student'>();
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
    const [selectedEmployerJob, setSelectedEmployerJob] = useState<JobDescription | null>(null);
    const [applyingJob, setApplyingJob] = useState<JobDescription | null>(null);
    const pageSize = 10;
    const [page, setPage] = useState(1);

    // Employer-created jobs
    const [employerJobs, setEmployerJobs] = useState<JobDescription[]>([]);
    const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fastAxiosInstance.get('/api/published-jobs', { params: { page: 1, page_size: 50 } })
            .then(res => setEmployerJobs(res.data.job_descriptions))
            .catch(err => console.error('Failed to fetch employer jobs', err));

        fastAxiosInstance.get('/api/applications/mine', { params: { page: 1, page_size: 100 } })
            .then(res => {
                const ids = new Set<string>(res.data.applications.map((a: { job_description_id: string }) => a.job_description_id));
                setAppliedJobIds(ids);
            })
            .catch(() => {});
    }, []);

    const handleApplyClick = (jobId: string) => {
        const job = employerJobs.find(j => j.id === jobId);
        if (job) {
            setSelectedEmployerJob(null); // close detail sidebar
            setApplyingJob(job);
        }
    };

    const handleApplicationSuccess = (jobId: string) => {
        setAppliedJobIds(prev => new Set(prev).add(jobId));
        setApplyingJob(null);
    };

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

    // Filter admin-uploaded jobs
    const filteredAdminJobs = jobs.filter(job => {
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

    // Filter employer-created jobs (apply keyword and location filters)
    const filteredEmployerJobs = employerJobs.filter(job => {
        if (filters.location) {
            const loc = `${job.location_city || ''}, ${job.location_province || ''}`.toLowerCase();
            if (!loc.includes(filters.location.toLowerCase())) return false;
        }
        if (filters.mode.length > 0) {
            if (!job.location_type || !filters.mode.includes(job.location_type as 'Remote' | 'On Site' | 'Hybrid')) return false;
        }
        if (filters.keywords) {
            const keywords = filters.keywords.toLowerCase().split(',').map(k => k.trim());
            const jobText = `${job.job_title} ${job.industry || ''} ${job.job_description || ''} ${job.skills?.map(s => s.skill_name).join(' ') || ''}`.toLowerCase();
            if (!keywords.some(keyword => jobText.includes(keyword))) return false;
        }
        return true;
    });

    const totalJobs = filteredAdminJobs.length + filteredEmployerJobs.length;
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

                {/* Job Listings - Merged */}
                <main className="lg:col-span-3 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl">
                            {totalJobs} Job{totalJobs !== 1 ? 's' : ''} Found
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {/* Employer Jobs */}
                        {filteredEmployerJobs.map(job => (
                            <Card
                                key={`emp-${job.id}`}
                                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => setSelectedEmployerJob(job)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <h3 className="text-lg font-medium">{job.job_title}</h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            {job.employment_type && <Badge>{job.employment_type}</Badge>}
                                            {job.location_type && <Badge variant="secondary">{job.location_type}</Badge>}
                                            {(job.location_city || job.location_province) && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {[job.location_city, job.location_province].filter(Boolean).join(', ')}
                                                </span>
                                            )}
                                        </div>
                                        {job.job_description && (
                                            <p className="text-sm text-gray-600 line-clamp-2">{job.job_description}</p>
                                        )}
                                        {job.compensation_min != null && job.compensation_max != null && (
                                            <p className="text-sm text-gray-500">
                                                ${job.compensation_min.toLocaleString()} - ${job.compensation_max.toLocaleString()} {job.compensation_currency}
                                            </p>
                                        )}
                                        {job.application_deadline && (
                                            <p className="text-xs text-gray-400">
                                                Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        {appliedJobIds.has(job.id) ? (
                                            <Button variant="outline" size="sm" disabled>
                                                Applied
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                onClick={() => handleApplyClick(job.id)}
                                            >
                                                <Send className="w-4 h-4 mr-1" />
                                                Apply
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {/* Admin-uploaded Jobs */}
                        {filteredAdminJobs.map(job => (
                            <div key={`admin-${job.id}`} className="cursor-pointer" onClick={() => setSelectedJob(job)}>
                                <JobCard
                                    job={job}
                                    isSaved={savedJobs.has(job.id.toString())}
                                    onToggleSave={toggleSave}
                                />
                            </div>
                        ))}
                    </div>

                    {totalJobs === 0 && (
                        <Card className="p-12 text-center">
                            <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg mb-2">No jobs found</h3>
                            <p className="text-gray-600">Try adjusting your filters to see more results</p>
                        </Card>
                    )}
                </main>
            </div>

            {/* Admin job detail sidebar */}
            <JobDetailsSidebar job={selectedJob} onClose={() => setSelectedJob(null)} />

            {/* Employer job detail sidebar */}
            <EmployerJobDetailSidebar
                job={selectedEmployerJob}
                onClose={() => setSelectedEmployerJob(null)}
                onApply={handleApplyClick}
                applied={selectedEmployerJob ? appliedJobIds.has(selectedEmployerJob.id) : false}
            />

            {/* Application form modal */}
            {applyingJob && user && (
                <ApplicationModal
                    job={applyingJob}
                    user={{ email: user.email, userData: user.userData as StudentUserData }}
                    onClose={() => setApplyingJob(null)}
                    onSuccess={handleApplicationSuccess}
                />
            )}
        </div>
    );
}
