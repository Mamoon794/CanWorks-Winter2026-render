export type UserType = 'student' | 'employer' | 'admin' | 'super-admin';

export interface User {
    id: string;
    email: string
    userData: UserData;
}

export interface StudentUser extends User {
    userData: StudentUserData;
}

export interface EmployerUser extends User {
    userData: EmployerUserData;
}

export interface AdminUser extends User {
    userData: AdminUserData;
}
export interface SuperAdminUser extends User {
    userData: SuperAdminUserData;
}

export interface BaseUserData {
    userType: UserType;
}

export interface StudentUserData extends BaseUserData {
    userType: 'student';
    university: string;
    graduationMonth: string;
    graduationYear: string;
    lookingFor: ('internship' | 'coop' | 'new-grad')[];
    coopSchool?: string | null;
    major: string;
    skills: string[];
}

export interface EmployerUserData extends BaseUserData {
    userType: 'employer';
    companyName: string;
    contactInfo: {
        phone: string;
        website: string;
        address: string;
    };
    availableForEvents: boolean;
    sponsor: boolean;
    specialNotes: string;
}

export interface AdminUserData extends BaseUserData {
    userType: 'admin';
}

export interface SuperAdminUserData extends BaseUserData {
    userType: 'super-admin';
}

export type UserData = StudentUserData | EmployerUserData | AdminUserData | SuperAdminUserData;

export type UserDataMap = {
    'student': StudentUserData;
    'employer': EmployerUserData;
    'admin': AdminUserData;
    'super-admin': SuperAdminUserData;
};

export type UserMap = {
    'student': StudentUser;
    'employer': EmployerUser;
    'admin': AdminUser;
    'super-admin': SuperAdminUser;
};

export interface JobPosting {
    id: string;
    title: string;
    employer: string;
    province: string | null;
    city: string | null;
    posting_date: string | null;
    application_deadline: string | null;
    link_to_posting: string | null;
    mode: 'Remote' | 'On Site' | 'Hybrid';
    job_type: 'intern' | 'coop' | 'new-grad' | 'part time' | 'full time';
    target_audience: 'Student' | 'New Graduate';
    description: string | null;
    skills: string[];
    applySite: string;
    responsibilities?: string;
    requirements?: string;
    duration_months: number;
    with_pay: boolean;
    term: 'summer' | 'fall' | 'spring' | 'winter';
    coopCredits?: string;
}

export interface SavedSearch {
    id: string;
    query: string;
    filters: {
        type?: ('internship' | 'coop' | 'new-grad')[];
        location?: string;
        keywords?: string[];
    };
    alertEnabled: boolean;
    createdAt: Date;
}

export interface CareerInsight {
    id: number;
    title: string;
    category: string;
    excerpt: string;
    content?: string;
    articleLink?: string;
    imageUrl?: string;
    readTime: string;
    created_at?: string;
    updated_at?: string;
}

export interface EmployerPermissions {
    employerId: string;
    companyName: string;
    email: string;
    canPostJobs: boolean;
    canAccessAnalytics: boolean;
    canParticipateInEvents: boolean;
    canSponsor: boolean;
    maxJobPostings: number;
    accountStatus: 'active' | 'suspended' | 'pending';
    lastActive: Date;
    memberSince: Date;
}

export interface JobDescriptionSkill {
    skill_id: string;
    skill_name: string;
    skill_type: 'required' | 'preferred';
}

export interface JobDescription {
    id: string;
    user_id: string;
    template_id: string | null;
    job_title: string;
    industry: string | null;
    job_function: string | null;
    seniority_level: string | null;
    employment_type: string | null;
    location_type: 'Remote' | 'Hybrid' | 'Onsite' | null;
    location_city: string | null;
    location_province: string | null;
    job_description: string | null;
    responsibilities: string[] | null;
    qualifications: string | null;
    compensation_min: number | null;
    compensation_max: number | null;
    compensation_currency: string;
    application_deadline: string | null;
    status: 'draft' | 'published';
    skills: JobDescriptionSkill[];
    created_at: string | null;
    updated_at: string | null;
    published_at: string | null;
}

export interface Template {
    id: string;
    template_name: string;
    industry: string;
    job_title: string;
    seniority_level: string;
    employment_type: string;
    province: string | null;
    city: string | null;
    job_description: string | null;
    responsibilities: string[] | null;
    qualifications: string | null;
    compensation_min: number | null;
    compensation_max: number | null;
}

export interface SkillOption {
    id: string;
    skill_name: string;
    skill_category: string | null;
}

// Application types
export type ApplicationStatus = 'pending' | 'reviewing' | 'interview' | 'offer' | 'rejected' | 'hired';

export interface ApplicationItem {
    id: string;
    student_user_id: string;
    job_description_id: string;
    status: ApplicationStatus;
    student_name: string | null;
    student_email: string | null;
    university: string | null;
    major: string | null;
    graduation_year: string | null;
    relevant_experience: string | null;
    resume_url: string | null;
    resume_filename: string | null;
    applied_at: string | null;
    updated_at: string | null;
    job_title: string | null;
}

export interface ApplicationListResponse {
    applications: ApplicationItem[];
    total: number;
    page: number;
    page_size: number;
}

// Analytics types
export interface PipelineStats {
    pending: number;
    reviewing: number;
    interview: number;
    offer: number;
    rejected: number;
    hired: number;
}

export interface TopSkillItem {
    skill_name: string;
    count: number;
}

export interface TopUniversityItem {
    university: string;
    count: number;
}

export interface EmployerAnalytics {
    total_applications: number;
    pipeline: PipelineStats;
    applications_per_position: number;
    time_to_hire_days: number | null;
    offer_acceptance_rate: number | null;
    interview_to_hire_ratio: string | null;
    job_status_counts: {
        draft: number;
        published: number;
        expired: number;
        deleted: number;
    };
    top_skills: TopSkillItem[];
    top_universities: TopUniversityItem[];
    total_published_jobs: number;
}

export interface JobDescriptionFormData {
    job_title: string;
    industry: string;
    job_function: string;
    seniority_level: string;
    employment_type: string;
    location_type: string;
    location_city: string;
    location_province: string;
    job_description: string;
    responsibilities: string[];
    required_skills: { skill_id: string; skill_name: string }[];
    preferred_skills: { skill_id: string, skill_name: string }[];
    qualifications: string;
    compensation_min: number | null;
    compensation_max: number | null;
    compensation_currency: string;
    application_deadline: string;
}