import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBountyById, FirebaseBounty } from '@/lib/bounties';
import { ReputationService } from '@/lib/reputationService';
import { TalentReputation } from '@/types/reputation';

// Query keys
export const queryKeys = {
  bounty: (id: string) => ['bounty', id],
  bounties: ['bounties'],
  reputation: (userId: string) => ['reputation', userId],
  submissions: (bountyId: string) => ['submissions', bountyId],
};

// Bounty queries
export function useBounty(id: string) {
  return useQuery({
    queryKey: queryKeys.bounty(id),
    queryFn: () => getBountyById(id),
    enabled: !!id,
  });
}

export function useBountySubmissions(bountyId: string) {
  return useQuery({
    queryKey: queryKeys.submissions(bountyId),
    queryFn: async () => {
      const response = await fetch(`/api/bounties/${bountyId}/submissions`);
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      return response.json();
    },
    enabled: !!bountyId,
  });
}

// Reputation queries
export function useTalentReputation(userId: string) {
  const reputationService = ReputationService.getInstance();
  
  return useQuery({
    queryKey: queryKeys.reputation(userId),
    queryFn: () => reputationService.getTalentReputation(userId),
    enabled: !!userId,
  });
}

// Mutation hooks
export function useUpdateBounty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<FirebaseBounty>;
    }) => {
      const response = await fetch(`/api/bounties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update bounty');
      }

      return response.json();
    },
    onSuccess: (_, { id }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.bounty(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bounties });
    },
  });
}

export function useUpdateReputation() {
  const queryClient = useQueryClient();
  const reputationService = ReputationService.getInstance();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: Partial<TalentReputation>;
    }) => {
      await reputationService.updateReputation(userId, data);
      return reputationService.getTalentReputation(userId);
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reputation(userId) });
    },
  });
}

// Optimistic updates helper
export function optimisticUpdate<T>(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[],
  updateFn: (oldData: T) => T
) {
  // Get the current data
  const oldData = queryClient.getQueryData<T>(queryKey);

  if (!oldData) return;

  // Optimistically update the data
  queryClient.setQueryData(queryKey, updateFn(oldData));

  // Return a rollback function
  return () => queryClient.setQueryData(queryKey, oldData);
}
