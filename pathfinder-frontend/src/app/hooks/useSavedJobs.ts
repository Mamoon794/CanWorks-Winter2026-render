'use client'

import { useEffect, useState } from 'react';
import { useUser } from '@/app/components/authComponents';
import type { JobPosting } from '@/types';
import { supabase } from "@/app/lib/supabase";

const API_BASE = 'http://127.0.0.1:8000';

export function useSavedJobs() {
  const { user } = useUser();
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [savedJobDetails, setSavedJobDetails] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  // -------------------------
  // Fetch saved jobs
  // -------------------------
  useEffect(() => {
    if (!user) {
      setSavedJobs(new Set());
      setSavedJobDetails([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSavedJobs = async () => {
      setLoading(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) return;

        const res = await fetch(`${API_BASE}/api/saved-jobs`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch');

        const data = await res.json();

        if (!cancelled) {
          const jobs: JobPosting[] = data.map((item: any) => item.job);
          const ids = new Set(jobs.map(job => job.id.toString()));

          setSavedJobs(ids);
          setSavedJobDetails(jobs);
          setLoading(false);
        }

      } catch (err) {
        if (!cancelled) {
          setSavedJobs(new Set());
          setSavedJobDetails([]);
          setLoading(false);
        }
      }
    };

    fetchSavedJobs();

    return () => {
      cancelled = true;
    };

  }, [user]);

  // -------------------------
  // Toggle Save
  // -------------------------
  const toggleSave = async (jobId: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error("No session found");
      return;
    }

    const token = session.access_token;
    const isSaved = savedJobs.has(jobId);

    try {
      if (isSaved) {
        // DELETE
        const res = await fetch(
          `${API_BASE}/api/saved-jobs/${jobId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error('Delete failed');

        // UI update
        setSavedJobs(prev => {
          const updated = new Set(prev);
          updated.delete(jobId);
          return updated;
        });

        setSavedJobDetails(prev =>
          prev.filter(job => job.id.toString() !== jobId)
        );

      } else {
        // POST
        const res = await fetch(
          `${API_BASE}/api/saved-jobs`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              job_id: Number(jobId)
            }),
          }
        );

        if (!res.ok) {
          const error = await res.json();
          console.error(error);
          throw new Error('Save failed');
        }

        // UI update
        setSavedJobs(prev => new Set(prev).add(jobId));
      }

    } catch (err) {
      console.error('Toggle save error:', err);
    }
  };

  return {
    savedJobs,
    savedJobDetails,
    toggleSave,
    loading,
  };
}