import clsx from 'clsx';

interface SummaryCardProps {
  label: string;
  value: string;
  unit: string;
  colorClass?: string;
}

export default function SummaryCard({ label, value, unit, colorClass }: SummaryCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-center">
      <p className="text-[11px] text-zinc-500 mb-0.5">{label}</p>
      <p className={clsx('tabular-nums text-lg font-extrabold', colorClass || 'text-navy-600 dark:text-navy-400')}>
        {value}
        <span className="text-[11px] font-medium text-zinc-400">{unit}</span>
      </p>
    </div>
  );
}
