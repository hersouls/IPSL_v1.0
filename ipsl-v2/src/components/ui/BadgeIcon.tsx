import type { LucideIcon } from 'lucide-react';
import {
  Wallet, TrendingUp, Award, Crown, Clock, Zap,
  UserCheck, Camera, MessageSquare, PenLine,
  MessageCircle, Megaphone, BookOpen, Vote,
  ShieldCheck, PartyPopper, Users, Trophy, Star,
} from 'lucide-react';
import type { BadgeDef, BadgeTier } from '../../types';

const ICON_MAP: Record<string, LucideIcon> = {
  Wallet, TrendingUp, Award, Crown, Clock, Zap,
  UserCheck, Camera, MessageSquare, PenLine,
  MessageCircle, Megaphone, BookOpen, Vote,
  ShieldCheck, PartyPopper, Users, Trophy, Star,
};

const BG: Record<BadgeTier, string> = {
  bronze: 'bg-emerald-100 dark:bg-emerald-900/30',
  silver: 'bg-sky-100 dark:bg-sky-900/30',
  gold: 'bg-amber-100 dark:bg-amber-900/30',
  special: 'bg-rose-100 dark:bg-rose-900/30',
};

const FG: Record<BadgeTier, string> = {
  bronze: 'text-emerald-600 dark:text-emerald-400',
  silver: 'text-sky-600 dark:text-sky-400',
  gold: 'text-amber-600 dark:text-amber-400',
  special: 'text-rose-600 dark:text-rose-400',
};

interface BadgeIconProps {
  badge: BadgeDef;
  size?: 'sm' | 'md';
}

export default function BadgeIcon({ badge, size = 'sm' }: BadgeIconProps) {
  const Icon = ICON_MAP[badge.icon];
  if (!Icon) return null;

  const outer = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const inner = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div
      className={`${outer} rounded-full ${BG[badge.tier]} flex items-center justify-center flex-shrink-0`}
      title={`${badge.name}: ${badge.description}`}
    >
      <Icon className={`${inner} ${FG[badge.tier]}`} />
    </div>
  );
}
