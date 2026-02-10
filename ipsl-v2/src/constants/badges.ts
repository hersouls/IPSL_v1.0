import type { BadgeDef, BadgeId, BadgeCategory, BadgeTier } from '../types';

export const BADGE_DEFS: BadgeDef[] = [
  // 회비 납부 (6)
  { id: 'first-payment', name: '첫 납부', description: '회비를 처음 납부했습니다', icon: 'Wallet', tier: 'bronze', category: 'fee' },
  { id: 'streak-3', name: '꾸준한 납부', description: '3개월 이상 연속 납부', icon: 'TrendingUp', tier: 'silver', category: 'fee' },
  { id: 'streak-6', name: '성실 회원', description: '6개월 이상 연속 납부', icon: 'Award', tier: 'gold', category: 'fee' },
  { id: 'perfect-year', name: '완납왕', description: '1년 12개월 전액 납부', icon: 'Crown', tier: 'gold', category: 'fee' },
  { id: 'early-bird', name: '얼리버드', description: '3개월 연속 10일 이내 납부', icon: 'Clock', tier: 'silver', category: 'fee' },
  { id: 'super-early', name: '슈퍼 얼리버드', description: '6개월 연속 10일 이내 납부', icon: 'Zap', tier: 'gold', category: 'fee' },

  // 프로필 (3)
  { id: 'profile-basic', name: '기본 프로필', description: '이름, 학위, 기수를 입력했습니다', icon: 'UserCheck', tier: 'bronze', category: 'profile' },
  { id: 'profile-complete', name: '완벽한 프로필', description: '모든 프로필 항목을 입력했습니다', icon: 'UserCheck', tier: 'gold', category: 'profile' },
  { id: 'avatar-set', name: '프로필 사진', description: '프로필 사진을 등록했습니다', icon: 'Camera', tier: 'bronze', category: 'profile' },

  // 커뮤니티 (5)
  { id: 'first-post', name: '첫 게시글', description: '게시판에 첫 글을 작성했습니다', icon: 'MessageSquare', tier: 'bronze', category: 'community' },
  { id: 'active-writer', name: '활발한 소통', description: '게시글 5개 이상 작성', icon: 'PenLine', tier: 'silver', category: 'community' },
  { id: 'first-comment', name: '첫 댓글', description: '첫 댓글을 작성했습니다', icon: 'MessageCircle', tier: 'bronze', category: 'community' },
  { id: 'announcer', name: '소식통', description: '공지사항을 작성했습니다', icon: 'Megaphone', tier: 'silver', category: 'community' },
  { id: 'prolific', name: '다작가', description: '게시글+공지+댓글 합계 15개 이상', icon: 'BookOpen', tier: 'gold', category: 'community' },

  // 투표 (2)
  { id: 'first-vote', name: '첫 투표', description: '투표에 처음 참여했습니다', icon: 'Vote', tier: 'bronze', category: 'voting' },
  { id: 'perfect-voter', name: '개근 투표', description: '모든 투표에 빠짐없이 참여', icon: 'ShieldCheck', tier: 'gold', category: 'voting' },

  // 행사 (3)
  { id: 'first-event', name: '첫 참여', description: '행사에 처음 참여했습니다', icon: 'PartyPopper', tier: 'bronze', category: 'event' },
  { id: 'social', name: '사교왕', description: '행사 5회 이상 참여', icon: 'Users', tier: 'silver', category: 'event' },
  { id: 'all-rounder', name: '올라운더', description: '4가지 행사 카테고리 모두 참여', icon: 'Trophy', tier: 'gold', category: 'event' },

  // 복합 (1)
  { id: 'mvp', name: 'MVP', description: '성실 회원 + 완벽한 프로필 + 투표 + 행사 참여', icon: 'Star', tier: 'special', category: 'composite' },
  // 임원 (1)
  { id: 'officer', name: '임원', description: 'IPSL 학생회 임원', icon: 'Crown', tier: 'special', category: 'composite' },
];

export const BADGE_MAP: Record<BadgeId, BadgeDef> = Object.fromEntries(
  BADGE_DEFS.map(b => [b.id, b])
) as Record<BadgeId, BadgeDef>;

export const BADGE_CATEGORY_LABELS: Record<BadgeCategory, string> = {
  fee: '회비 납부',
  profile: '프로필',
  community: '커뮤니티',
  voting: '투표',
  event: '행사',
  composite: '특별',
};

export const BADGE_TIER_LABELS: Record<BadgeTier, string> = {
  bronze: '브론즈',
  silver: '실버',
  gold: '골드',
  special: '스페셜',
};

// Tier sort order (higher tier first)
export const TIER_ORDER: Record<BadgeTier, number> = {
  special: 0,
  gold: 1,
  silver: 2,
  bronze: 3,
};
