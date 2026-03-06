'use client'

import { useState, useEffect } from 'react';
// Updated imports to use the single widgets file
// Updated imports to use the single widgets file
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/globalComponents';
import { Header } from '@/app/components/header'
import { BarChart3, Briefcase } from 'lucide-react';
import { HomePage } from './HomePage';
import { ExplorePage } from './ExplorePage';
import { CareerInsightsPage } from './CareerInsightsPage';
import { ProfilePage } from './ProfilePage';
import { UserProvider, CheckUser } from '@/app/components/authComponents';
import AdminReports from '@/app/admin-dashboard/reports';
import fastAxiosInstance from '@/axiosConfig/axiosfig';
import type { JobPosting } from '@/types';

export default function StudentDashboardPage() {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [recommended, setRecommended] = useState<JobPosting[]>([]);

    useEffect(() => {
        fetchJobs();
        fetchRecommendations();
    }, []);

    const fetchJobs = () => {
        let url = `/api/jobs?page=${1}&page_size=${10}`;

        fastAxiosInstance.get(url).then(
            response => {
                response.data.jobs.forEach((job: JobPosting) => {
                    job.applySite = job.link_to_posting ? new URL(job.link_to_posting).hostname.replace('www.', '').replace('.com', '') : 'Unknown';
                });
                setJobs(response.data.jobs);
                setTotal(response.data.total);
            }
        ).catch(
            error => console.error("Failed to fetch jobs", error)
        );
    };

    const fetchRecommendations = async () => {
        try {
            const res = await fastAxiosInstance.get('/api/recommendations?k=4');
            const recs: JobPosting[] = res.data.jobs || [];
            recs.forEach((job: JobPosting) => {
                job.applySite = job.link_to_posting ? new URL(job.link_to_posting).hostname.replace('www.', '').replace('.com', '') : 'Unknown';
            });
            setRecommended(recs);
        } catch (error) {
            console.error('Failed to fetch recommendations', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <UserProvider userType={"student"}>
                <CheckUser requireUser={true}>
                    <div className="max-w-7xl mx-auto px-4">
                        <Header
                            title={"Dashboard"}
                        >
                        </Header>

                        <Tabs defaultValue="home" className="space-y-6">
                        {/* Updated TabsList to be cleaner without grid constraints */}
                        <TabsList className="mb-6">
                            <TabsTrigger value="home" className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Home
                            </TabsTrigger>
                            <TabsTrigger value="explore" className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Explore
                            </TabsTrigger>
                            <TabsTrigger value="career" className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Career Insights
                            </TabsTrigger>
                            <TabsTrigger value="profile" className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Profile
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="home" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                            <HomePage totalJobs={total} recommendedJobs={recommended}>
                            </HomePage>

                        </TabsContent>

                        <TabsContent value="explore" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                                <ExplorePage jobs={jobs} total={total}>
                                </ExplorePage>
                        </TabsContent>

                        <TabsContent value="career" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                                <CareerInsightsPage>
                                </CareerInsightsPage>
                        </TabsContent>

                        <TabsContent value="profile" className="space-y-4 animate-in fade-in-50 duration-500 slide-in-from-bottom-2">
                                <ProfilePage>
                                </ProfilePage>
                        </TabsContent>
                        </Tabs>
                    </div>
                </CheckUser>
            </UserProvider>
        </div>
    );
}