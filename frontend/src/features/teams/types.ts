export interface Team {
  id: number;
  name: string;
  home_area_id: number;
  specialty: number; // 0=Medical, 1=Fire, 2=Police, 3=Disaster, 4=Hazmat
  capacity: number;
  available_units: number;
  handled_count: number;
  total_response_time: number;
}
