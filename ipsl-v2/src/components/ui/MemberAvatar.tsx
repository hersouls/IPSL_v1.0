const SIZE_MAP = {
  xs: { box: 'w-4 h-4', text: 'text-[7px]', radius: 'rounded' },
  sm: { box: 'w-5 h-5', text: 'text-[9px]', radius: 'rounded-md' },
  md: { box: 'w-8 h-8', text: 'text-xs', radius: 'rounded-lg' },
  lg: { box: 'w-10 h-10', text: 'text-sm', radius: 'rounded-xl' },
} as const;

interface MemberAvatarProps {
  name: string;
  avatar?: string;
  size?: keyof typeof SIZE_MAP;
  className?: string;
}

export default function MemberAvatar({ name, avatar, size = 'sm', className = '' }: MemberAvatarProps) {
  const s = SIZE_MAP[size];
  const initial = (name || '?').charAt(0);

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${s.box} ${s.radius} object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${s.box} ${s.radius} bg-navy-100 dark:bg-navy-900/30 flex items-center justify-center ${s.text} font-bold text-navy-600 dark:text-navy-400 flex-shrink-0 ${className}`}
    >
      {initial}
    </div>
  );
}
