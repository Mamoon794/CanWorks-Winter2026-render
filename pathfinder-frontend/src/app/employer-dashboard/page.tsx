'use client'

// Updated imports to use the single widgets file
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/globalComponents';
import { Header } from '@/app/components/header'
import { BarChart3, Briefcase, PlusCircle, FileEdit, CheckCircle, Clock } from 'lucide-react';
import { EmployerAnalyticsPage } from './EmployerAnalyticsPage';
import { EmployerProfilePage } from './EmployerProfilePage';
import { CreateJobPostingsPage } from './CreateJobPostingsPage';
import { JobPostingDraftsPage } from './JobPostingDraftsPage';
import { ActiveJobPostingsPage } from './ActiveJobPostingsPage';
import { JobPostingsHistoryPage } from './JobPostingsHistoryPage';
import { UserProvider, CheckUser } from '@/app/components/authComponents';

export default function EmployerDashboardPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <UserProvider userType={"employer"}>
                <CheckUser requireUser={true}>
                    <div className="max-w-7xl mx-auto px-4">
                        <Header
                            title={"Employer Dashboard"}
                        >
                        </Header>

                        <Tabs defaultValue="analytics" className="space-y-6">
                        {/* Updated TabsList to be cleaner without grid constraints */}
                        <TabsList className="mb-6">
                            <TabsTrigger value="analytics" className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Analytics
                            </TabsTrigger>
                            <TabsTrigger value="profile" className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Profile
                            </TabsTrigger>
                            
                            <TabsTrigger value="create" className="flex items-center gap-2">
                                <PlusCircle className="w-4 h-4"/>
                                Create Job Posting
                            </TabsTrigger>

                            <TabsTrigger value="drafts" className="flex items-center gap-2">
                                <FileEdit className="w-4 h-4"/>
                                Drafts
                            </TabsTrigger>

                            <TabsTrigger value="active" className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4"/>
                                Active
                            </TabsTrigger>

                            <TabsTrigger value="history" className="flex items-center gap-2">
                                <Clock className="w-4 h-4"/>
                                History
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="analytics" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                                <EmployerAnalyticsPage />
                        </TabsContent>

                        <TabsContent value="profile" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                                <EmployerProfilePage />
                        </TabsContent>

                        <TabsContent value="create" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                            <CreateJobPostingsPage />
                        </TabsContent>

                        <TabsContent value="drafts" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                            <JobPostingDraftsPage />
                        </TabsContent>

                        <TabsContent value="active" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                            <ActiveJobPostingsPage />
                        </TabsContent>

                        <TabsContent value="history" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                            <JobPostingsHistoryPage />
                        </TabsContent>

                        </Tabs>
                    </div>
                </CheckUser>
            </UserProvider>
        </div>
    );
}