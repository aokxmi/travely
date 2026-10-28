import { ItineraryDay } from '../types';

export function toNumber(s: string): number {
  const clean = s.replace(/,/g, '').trim();
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
}

export function checkBudget(text: string): { pySum: number; modelTotal: number | null } {
  const parts = text.split(/Total:/i);
  const body = parts[0] || '';
  const totalLine = parts.length > 1 ? parts.slice(1).join('Total:') : '';

  const itemMatches = [...body.matchAll(/Rs\s*([\d,]+)/gi)];
  let pythonSum = 0;
  for (const m of itemMatches) {
    if (m[1]) {
      pythonSum += toNumber(m[1]);
    }
  }

  const claimedMatches = [...totalLine.matchAll(/Rs\s*([\d,]+)/gi)];
  let modelTotal: number | null = null;
  if (claimedMatches.length > 0 && claimedMatches[0][1]) {
    modelTotal = toNumber(claimedMatches[0][1]);
  }

  return { pySum: pythonSum, modelTotal };
}

export function parseItinerary(text: string): ItineraryDay[] {
  const body = text.split(/Total:/i)[0] || '';
  const days: ItineraryDay[] = [];

  const lines = body.split(/\r?\n/);
  for (let rawLine of lines) {
    let line = rawLine.trim().replace(/^[*#\s]+/, '').trim();
    if (!line) continue;

    const dayMatch = line.match(/^day\s*(\d+)/i);
    if (dayMatch) {
      days.push({ n: dayMatch[1], items: [], total: 0 });
      continue;
    }

    // Match list items like "- Morning: activity (Rs 500)" or "* Stay: Hotel (Rs 1200)"
    const itemMatch = line.match(/^[-*\u2022]\s*\*?\*?([A-Za-z ]+?)\*?\*?\s*:\s*\*?\*?\s*(.+)$/);
    if (itemMatch && days.length > 0) {
      const label = itemMatch[1].trim();
      const rest = itemMatch[2];

      const costMatches = [...rest.matchAll(/Rs\s*([\d,]+)/gi)];
      const amount = costMatches.length > 0 ? toNumber(costMatches[costMatches.length - 1][1]) : 0;

      const desc = rest.replace(/\(?\s*Rs\s*[\d,]+\s*\)?/gi, '').replace(/^[\s\-:*]+|[\s\-:*]+$/g, '');

      const currentDay = days[days.length - 1];
      currentDay.items.push({
        label,
        desc,
        cost: amount,
      });
      currentDay.total += amount;
    }
  }

  return days.filter((d) => d.items.length > 0);
}
