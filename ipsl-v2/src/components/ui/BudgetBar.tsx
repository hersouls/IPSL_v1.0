export default function BudgetBar({ pct, color = 'navy' }: { pct: number; color?: string }) {
  return (
    <div className="budget-bar">
      <div className={`budget-fill bg-${color}-500`} style={{ width: `${Math.min(pct, 100).toFixed(2)}%` }} />
    </div>
  );
}
