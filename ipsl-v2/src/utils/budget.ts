import type { Settings, SupportCategoryKey } from '../types';

export function calcBudget(settings: Settings): number {
  return (
    settings.condolence * 5 +
    settings.smallGatheringCap +
    settings.annualEvent +
    settings.teachersDay
  );
}

export function calcReserve(settings: Settings): number {
  const total = settings.monthlyFee * 32 * 12;
  const expenses = calcBudget(settings);
  return Math.max(0, total - expenses);
}

export function getCatBudget(cat: SupportCategoryKey, settings: Settings): number {
  if (cat === 'condolence') return settings.condolence * 5;
  if (cat === 'smallGathering') return settings.smallGatheringCap;
  if (cat === 'annualEvent') return settings.annualEvent;
  if (cat === 'teachersDay') return settings.teachersDay;
  return 0;
}
