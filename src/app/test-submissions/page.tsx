'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TestSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bountyId, setBountyId] = useState<string>('1');

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all submissions for debugging
      const response = await fetch('/api/debug/submissions');
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      const data = await response.json();
      setSubmissions(data);
    } catch (err: any) {
      console.error('Error fetching submissions:', err);
      setError(err.message || 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchBountySubmissions = async () => {
    if (!bountyId) return;
    
    setLoading(true);
    setError(null);
    try {
      // Fetch submissions for a specific bounty
      const response = await fetch(`/api/bounties/${bountyId}/submissions`);
      if (!response.ok) {
        throw new Error('Failed to fetch bounty submissions');
      }
      const data = await response.json();
      setSubmissions(data);
    } catch (err: any) {
      console.error('Error fetching bounty submissions:', err);
      setError(err.message || 'Failed to fetch bounty submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Test Submissions</h1>
          <Link
            href="/dashboard"
            className="bg-white/10 backdrop-blur-xl border border-white/20 text-white py-2 px-4 rounded-lg hover:bg-white/20 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={fetchSubmissions}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Fetch All Submissions
          </button>

          <div className="flex gap-2">
            <input
              type="text"
              value={bountyId}
              onChange={(e) => setBountyId(e.target.value)}
              placeholder="Bounty ID"
              className="bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2"
            />
            <button
              onClick={fetchBountySubmissions}
              className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Fetch Bounty Submissions
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/40 text-red-300 border border-red-700/30 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">
              {submissions.length} Submissions Found
            </h2>

            {submissions.length === 0 ? (
              <p className="text-gray-300">No submissions found.</p>
            ) : (
              <div className="space-y-6">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="bg-black/20 p-4 rounded-lg border border-white/10"
                  >
                    <div className="flex justify-between mb-2">
                      <h3 className="font-medium text-white">
                        Submission ID: {submission.id}
                      </h3>
                      <span className="text-gray-400">
                        Bounty ID: {submission.bountyId}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm text-gray-400 mb-1">
                          Applicant Address
                        </h4>
                        <p className="text-gray-300 break-all">
                          {submission.applicantAddress || submission.applicant || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm text-gray-400 mb-1">User ID</h4>
                        <p className="text-gray-300">{submission.userId || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm text-gray-400 mb-1">Content</h4>
                      <div className="bg-black/30 p-3 rounded text-gray-300 whitespace-pre-wrap">
                        {submission.content || submission.details || 'No content'}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm text-gray-400 mb-1">Links</h4>
                      <div className="bg-black/30 p-3 rounded text-gray-300">
                        {submission.links || 'No links'}
                      </div>
                    </div>

                    <div className="text-sm text-gray-400">
                      Created: {submission.createdAt || submission.created || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
 
 
 