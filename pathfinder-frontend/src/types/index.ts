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
    id: string;
    title: string;
    category: string;
    excerpt: string;
    imageUrl: string;
    readTime: string;
    url: string;
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