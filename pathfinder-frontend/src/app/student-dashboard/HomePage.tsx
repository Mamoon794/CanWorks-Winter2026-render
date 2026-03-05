import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import { Card } from '@/app/components/globalComponents';
import { JobCard } from '@/app/components/JobCard';
import { BarChart3, Bookmark, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { mockJobs } from '@/data/mockData';
import { useSavedJobs } from '@/app/hooks/useSavedJobs';

function NextArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-50"
    >
      <ChevronRight className="w-5 h-5" />
    </button>
  );
}

function PrevArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:bg-gray-50"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
  );
}

export function HomePage({ totalJobs = 0 }: { totalJobs: number }) {
    const { savedJobDetails, toggleSave, loading } = useSavedJobs();

    if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Loading saved jobs...</p>
      </div>
    );
  }

    // useEffect(() => {
    //     localStorage.setItem('savedJobs', JSON.stringify(Array.from(savedJobs)));
    // }, [savedJobs]);

    // const toggleSave = (jobId: string) => {
    //     setSavedJobs(prev => {
    //     const next = new Set(prev);
    //     if (next.has(jobId)) next.delete(jobId);
    //     else next.add(jobId);
    //     return next;
    //     });
    // };

    const recommendedJobs = mockJobs.slice(0, 4);
    const wildcardJobs = mockJobs.slice(4);

    const carouselSettings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-sm text-gray-600">Job Postings</h3>
            </div>
            <p className="text-3xl">{totalJobs}</p>
            </Card>

            <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                <Bookmark className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-sm text-gray-600">Saved Jobs</h3>
            </div>
            <p className="text-3xl">{savedJobDetails?.length || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Ready to apply</p>
            </Card>

            <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                <Bell className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-sm text-gray-600">Active Alerts</h3>
            </div>
            <p className="text-3xl">3</p>
            <p className="text-sm text-gray-500 mt-1">Followed searches</p>
            </Card>
        </div>
        
        <section>
        <h2 className="text-2xl mb-6">Saved Jobs</h2>

        {savedJobDetails.length === 0 ? (
          <p className="text-gray-600">You have no saved jobs right now.</p>
        ) : (
          <Slider {...carouselSettings}>
            {savedJobDetails.map(job => (
              <JobCard
                key={job.id}
                job={job}
                isSaved={true}
                onToggleSave={toggleSave}
              />
            ))}
          </Slider>
        )}
      </section>
      
        {/* Recommended For You Carousel */}
        <section>
            <h2 className="text-2xl mb-6">Recommended For You</h2>
            <div className="relative px-12">
            <Slider {...carouselSettings}>
                {recommendedJobs.map((job) => (
                <div key={job.id} className="px-2">
                    <JobCard
                    job={job}
                    isSaved={savedJobDetails?.some(j => j.id === job.id) || false}
                    onToggleSave={toggleSave}
                    />
                </div>
                ))}
            </Slider>
            </div>
        </section>

        {/* Wildcard Carousel */}
        <section>
            <h2 className="text-2xl mb-6">Wildcard Opportunities</h2>
            <p className="text-gray-600 mb-6">
            Roles that match your skills but might be outside your usual search
            </p>
            <div className="relative px-12">
            <Slider {...carouselSettings}>
                {wildcardJobs.map((job) => (
                <div key={job.id} className="px-2">
                    <JobCard
                    job={job}
                    isSaved={savedJobDetails?.some(j => j.id === job.id) || false}
                    onToggleSave={toggleSave}
                    />
                </div>
                ))}
            </Slider>
            </div>
        </section>
        </div>
    );
}
