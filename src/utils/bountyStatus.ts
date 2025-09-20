import { BountyStatus } from '@/types/bounty';

export function isExpired(deadline: string | Date): boolean {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  return now > deadlineDate;
}

export function getEffectiveStatus(status: BountyStatus, deadline: string | Date): BountyStatus {
  if (isExpired(deadline) || status === BountyStatus.COMPLETED) {
    return BountyStatus.COMPLETED;
  }
  return status;
}

export function canSubmit(status: BountyStatus, deadline: string | Date): boolean {
  return status === BountyStatus.OPEN && !isExpired(deadline);
}

export function canEdit(status: BountyStatus, deadline: string | Date, hasSubmissions: boolean): boolean {
  return !hasSubmissions && !isExpired(deadline) && status === BountyStatus.OPEN;
}

export function getStatusLabel(status: BountyStatus): string {
  switch (status) {
    case BountyStatus.OPEN:
      return 'Open for Submissions';
    case BountyStatus.IN_PROGRESS:
      return 'In Progress';
    case BountyStatus.COMPLETED:
      return 'Completed';
    case BountyStatus.CANCELLED:
      return 'Cancelled';
    default:
      return status;
  }
}

export function getStatusDescription(status: BountyStatus, deadline: string | Date): string {
  if (isExpired(deadline)) {
    return 'This bounty has expired and is no longer accepting submissions.';
  }

  switch (status) {
    case BountyStatus.OPEN:
      return 'This bounty is open and accepting submissions.';
    case BountyStatus.IN_PROGRESS:
      return 'This bounty is currently being worked on.';
    case BountyStatus.COMPLETED:
      return 'This bounty has been completed and winners have been selected.';
    case BountyStatus.CANCELLED:
      return 'This bounty has been cancelled.';
    default:
      return '';
  }
}

export function getTimeRemaining(deadline: string | Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
} {
  const deadlineTime = new Date(deadline).getTime();
  const nowTime = Date.now();
  const timeLeft = deadlineTime - nowTime;

  if (timeLeft <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
    };
  }

  // Calculate time units
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    expired: false,
  };
}

export function formatTimeRemaining(timeRemaining: ReturnType<typeof getTimeRemaining>): string {
  if (timeRemaining.expired) {
    return 'Expired';
  }

  if (timeRemaining.days > 0) {
    return `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`;
  }

  return [
    timeRemaining.hours.toString().padStart(2, '0'),
    timeRemaining.minutes.toString().padStart(2, '0'),
    timeRemaining.seconds.toString().padStart(2, '0'),
  ].join(':');
}
