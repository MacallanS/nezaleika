export interface ReportField {
  id: number;
  name: string;
  value: number;
}

export interface Report {
  id: number;
  name: string;
  handler_id: number;
  fields: ReportField[];
}

export interface ShiftData {
  id: number;
  user_id: number;
  point_id: number | null;
  start_coords: string;
  end_coords: string | null;
  start_file: string;
  end_file: string | null;
  start_time: string;
  end_time: string;
  reports: Report[];
}

export type FetchShiftDataFn = (userId: number, shiftId: number) => Promise<ShiftData>;
/** Колбэк для получения id текущего пользователя (приложение само вызывает свой API) */
export type GetCurrentUserIdFn = () => Promise<number | null>;
