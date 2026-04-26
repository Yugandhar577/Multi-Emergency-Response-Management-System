export interface Incident {
  id: number;
  area_id: number;
  category: number; // 0=Medical, 1=Fire, 2=Police, 3=Disaster, 4=Hazmat
  severity: number; // 1..10
  status: number; // 0=Pending, 1=Assigned, 2=Handled
  assigned_team: string;
  reporter: string;
  description: string;
  eta_units: number;
  created_at: number;
  resolved_at: number;
}

export interface CreateIncidentRequest {
  area_id: number;
  category: number;
  severity: number;
  reporter: string;
  description: string;
}

export interface CreateIncidentResponse {
  id: number;
  status: string;
}
