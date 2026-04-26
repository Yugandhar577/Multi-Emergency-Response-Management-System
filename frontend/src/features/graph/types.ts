export interface Area {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

export interface Edge {
  id: number;
  u: number;
  v: number;
  weight: number;
  bonus: number;
  priority: boolean;
}
