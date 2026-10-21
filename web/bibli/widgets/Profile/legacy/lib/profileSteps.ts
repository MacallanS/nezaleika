export const PROFILE_WIZARD_STEP_COUNT = 6;

export const PROFILE_STEP_TITLES: Record<number, string> = {
  1: "Контактные данные",
  2: "Паспортные данные",
  3: "Документы",
  4: "Тип агента",
  5: "Дополнительные данные",
  6: "Подтверждение",
};

export function isProfileStepComplete(
  step: number,
  completedSteps: Set<number>,
): boolean {
  return completedSteps.has(step);
}

export function nextIncompleteProfileStep(
  fromStep: number,
  completedSteps: Set<number>,
): number | null {
  for (let step = fromStep; step <= PROFILE_WIZARD_STEP_COUNT; step++) {
    if (!isProfileStepComplete(step, completedSteps)) return step;
  }
  return null;
}
