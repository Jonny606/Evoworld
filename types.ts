export interface Player {
  name: string;
  rating: number;
  country: string;
  position: string;
  team: string;
  image: string;
}

export interface Pack {
  type: 'low' | 'medium' | 'high';
  cost: number;
  credits: number;
  label: string;
}