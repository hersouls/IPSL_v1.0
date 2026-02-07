interface YearSelectProps {
  value: string;
  onChange: (year: string) => void;
}

export default function YearSelect({ value, onChange }: YearSelectProps) {
  const cy = new Date().getFullYear();
  const years = [];
  for (let y = cy + 1; y >= cy - 3; y--) years.push(y);

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-1.5 rounded-lg text-sm font-semibold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
    >
      {years.map(y => (
        <option key={y} value={String(y)}>{y}년</option>
      ))}
    </select>
  );
}
