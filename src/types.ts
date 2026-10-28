export interface ItineraryItem {
  label: string;
  desc: string;
  cost: number;
}

export interface ItineraryDay {
  n: string;
  items: ItineraryItem[];
  total: number;
}

export interface PlanResult {
  rawText: string;
  daysData: ItineraryDay[];
  pySum: number;
  modelTotal: number | null;
  budget: number;
  pct: number;
  over: boolean;
  destination: string;
  days: number;
}
