export interface DashboardEvent {
  time: string;
  title: string;
  type: 'calendar' | 'meal';
}

export interface MealsBySlot {
  [slot: string]: string[];
}

export interface EnergyData {
  value: number;
  cost: number;
  unit: string;
  chartData: number[];
}

export interface PurifierData {
  name: string;
  type: string;
  power: boolean;
  mode: string | null;
  fan_level: number;
  filter_life: number;
  display: boolean;
  supports_air_quality: boolean;
  air_quality: number | null;
  error?: string;
}

// Dummy export to prevent Vite from treating this as a type-only file
export const TYPES_LOADED = true;
