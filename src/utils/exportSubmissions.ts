import { Submission } from '@/types/bounty';

export function exportSubmissionsToCSV(submissions: Submission[], bountyTitle: string) {
  // Format date for filename
  const dateStr = new Date().toISOString().split('T')[0];
  const safeTitle = bountyTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `${safeTitle}_submissions_${dateStr}.csv`;

  // Define CSV headers
  const headers = [
    'Applicant Address',
    'Wallet Address',
    'Submission Date',
    'Ranking',
    'Content',
    'External Link',
    'Status'
  ];

  // Format submission data
  const rows = submissions.map(submission => {
    // Clean content text (remove HTML and special characters)
    const cleanContent = submission.content
      ? submission.content.replace(/<[^>]*>/g, ' ').replace(/[,"\n\r]/g, ' ')
      : '';

    return [
      submission.applicant || '',
      submission.walletAddress || '',
      new Date(submission.created).toLocaleString(),
      submission.ranking ? `${submission.ranking}` : 'Not Ranked',
      cleanContent,
      submission.link || '',
      submission.status || 'PENDING'
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
