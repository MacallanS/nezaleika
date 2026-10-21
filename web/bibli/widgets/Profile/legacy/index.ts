/**
 * Profile legacy — accordion/wizard monolith before RR redesign.
 * Prefer: `bibli/widgets/Profile/legacy`
 */
export { default as ProfileLegacy } from './ProfileLegacy.vue'
export { default as TraineeExpiredCard } from './TraineeExpiredCard.vue'
export {
  PROFILE_WIZARD_STEP_COUNT,
  PROFILE_STEP_TITLES,
  isProfileStepComplete,
  nextIncompleteProfileStep,
} from './lib/profileSteps'
