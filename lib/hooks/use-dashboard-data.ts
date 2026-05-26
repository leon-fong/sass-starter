'use client';

import useSWR from 'swr';
import type { TeamDataWithMembers, User } from '@/lib/db/schema';

export type CurrentUser = Pick<User, 'id' | 'name' | 'email' | 'role'>;

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return response.json();
};

export function useCurrentUser() {
  return useSWR<CurrentUser>('/api/user', fetchJson);
}

export function useCurrentTeam() {
  return useSWR<TeamDataWithMembers>('/api/team', fetchJson);
}
