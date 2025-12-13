/**
 * Relationships Service
 *
 * API methods for managing coach-athlete relationships.
 *
 * @module services/relationships
 */
import { api } from './api';

export type RelationshipStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'ENDED';

export interface UserSummary {
  id: string;
  fullName: string | null;
  email: string;
  ftp?: number | null;
}

export interface CoachAthleteListItem {
  id: string;
  status: RelationshipStatus;
  notes: string | null;
  startedAt: string | null;
  athlete: UserSummary;
}

export interface AthleteCoachListItem {
  id: string;
  status: RelationshipStatus;
  startedAt: string | null;
  coach: UserSummary;
}

export interface RelationshipResponse {
  id: string;
  coachId: string;
  athleteId: string;
  status: RelationshipStatus;
  notes: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  coach?: UserSummary;
  athlete?: UserSummary;
}

export interface CreateRelationshipDto {
  coachId: string;
  athleteId: string;
  notes?: string;
}

export interface UpdateRelationshipDto {
  status?: RelationshipStatus;
  notes?: string;
}

export const relationshipsService = {
  /**
   * Get all athletes for a coach
   */
  getAthletesForCoach(
    coachId: string,
    status?: RelationshipStatus
  ): Promise<CoachAthleteListItem[]> {
    const params = status ? { status } : undefined;
    return api.get<CoachAthleteListItem[]>(
      `/relationships/coach/${coachId}/athletes`,
      { params }
    );
  },

  /**
   * Get all coaches for an athlete
   */
  getCoachesForAthlete(
    athleteId: string,
    status?: RelationshipStatus
  ): Promise<AthleteCoachListItem[]> {
    const params = status ? { status } : undefined;
    return api.get<AthleteCoachListItem[]>(
      `/relationships/athlete/${athleteId}/coaches`,
      { params }
    );
  },

  /**
   * Get pending invitations for an athlete
   */
  getPendingInvitationsForAthlete(athleteId: string): Promise<AthleteCoachListItem[]> {
    return api.get<AthleteCoachListItem[]>(
      `/relationships/athlete/${athleteId}/pending`
    );
  },

  /**
   * Get pending invitations sent by a coach
   */
  getPendingInvitationsByCoach(coachId: string): Promise<CoachAthleteListItem[]> {
    return api.get<CoachAthleteListItem[]>(
      `/relationships/coach/${coachId}/pending`
    );
  },

  /**
   * Create a new relationship invitation
   */
  create(dto: CreateRelationshipDto): Promise<RelationshipResponse> {
    return api.post<RelationshipResponse>('/relationships', dto);
  },

  /**
   * Get a specific relationship
   */
  getById(id: string): Promise<RelationshipResponse> {
    return api.get<RelationshipResponse>(`/relationships/${id}`);
  },

  /**
   * Update a relationship
   */
  update(id: string, dto: UpdateRelationshipDto): Promise<RelationshipResponse> {
    return api.patch<RelationshipResponse>(`/relationships/${id}`, dto);
  },

  /**
   * Accept a pending invitation
   */
  accept(id: string): Promise<RelationshipResponse> {
    return api.post<RelationshipResponse>(`/relationships/${id}/accept`);
  },

  /**
   * Decline a pending invitation
   */
  decline(id: string): Promise<void> {
    return api.post<void>(`/relationships/${id}/decline`);
  },

  /**
   * End an active relationship
   */
  end(id: string): Promise<RelationshipResponse> {
    return api.post<RelationshipResponse>(`/relationships/${id}/end`);
  },

  /**
   * Pause a relationship
   */
  pause(id: string): Promise<RelationshipResponse> {
    return api.post<RelationshipResponse>(`/relationships/${id}/pause`);
  },

  /**
   * Resume a paused relationship
   */
  resume(id: string): Promise<RelationshipResponse> {
    return api.post<RelationshipResponse>(`/relationships/${id}/resume`);
  },

  /**
   * Delete a relationship
   */
  delete(id: string): Promise<void> {
    return api.delete<void>(`/relationships/${id}`);
  },
};
