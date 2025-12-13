/**
 * Tour & Setup Checklist Types
 * Types for the guided tour and setup checklist features
 */

/**
 * Tour state from API
 */
export interface TourState {
  tourCompleted: boolean;
  tourDismissed: boolean;
  setupChecklistCompleted: string[];
}

/**
 * Setup checklist item identifiers
 */
export type ChecklistItemId =
  | 'profile'       // Complete profile in settings
  | 'availability'  // Set availability
  | 'goals'         // Set training goals
  | 'assessment';   // Complete fitness assessment

/**
 * Setup checklist item definition
 */
export interface ChecklistItem {
  id: ChecklistItemId;
  titleKey: string;
  descriptionKey: string;
  linkTo: string;
  icon: string;
}

/**
 * All setup checklist items
 */
export const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'profile',
    titleKey: 'tour.checklist.profile.title',
    descriptionKey: 'tour.checklist.profile.description',
    linkTo: '/settings',
    icon: 'user',
  },
  {
    id: 'availability',
    titleKey: 'tour.checklist.availability.title',
    descriptionKey: 'tour.checklist.availability.description',
    linkTo: '/settings',
    icon: 'calendar',
  },
  {
    id: 'goals',
    titleKey: 'tour.checklist.goals.title',
    descriptionKey: 'tour.checklist.goals.description',
    linkTo: '/settings',
    icon: 'target',
  },
  {
    id: 'assessment',
    titleKey: 'tour.checklist.assessment.title',
    descriptionKey: 'tour.checklist.assessment.description',
    linkTo: '/dashboard',
    icon: 'activity',
  },
];
