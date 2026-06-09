export interface ReporteCYR {
  id: number;
  fecha_operacional: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface ReporteCYRCreate {
  fecha_operacional: string;
}
