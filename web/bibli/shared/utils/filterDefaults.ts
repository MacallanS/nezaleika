export interface ProjectPointFilterState {
  project?: number;
  point?: number;
}

export interface ProjectLike {
  id: number;
}

export interface PointLike {
  id: number;
}

/** Автовыбор проекта и точки, если доступен только один вариант. Возвращает true, если что-то изменилось. */
export function applySingleProjectPointDefaults(
  filters: ProjectPointFilterState,
  projects: ProjectLike[],
  getPointsByProjectId: (projectId: number) => PointLike[],
): boolean {
  let changed = false;

  if (!filters.project && projects.length === 1) {
    filters.project = projects[0].id;
    changed = true;
  }

  if (filters.project && filters.point === undefined) {
    const projectPoints = getPointsByProjectId(filters.project);
    if (projectPoints.length === 1) {
      filters.point = projectPoints[0].id;
      changed = true;
    }
  }

  return changed;
}
