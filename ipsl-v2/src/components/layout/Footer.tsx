import { useUiStore } from '../../stores/uiStore';
import { useMemberStore } from '../../stores/memberStore';

export default function Footer() {
  const openTermsModal = useUiStore(s => s.openTermsModal);
  const members = useMemberStore(s => s.members);
  const president = members.find(m => m.role === '회장');
  const contactEmail = president?.email || '';

  return (
    <footer className="mt-auto py-8 text-center text-xs text-zinc-400 dark:text-zinc-600 no-print space-y-3">
      <div className="space-y-1">
        <p className="font-semibold text-zinc-500 dark:text-zinc-500">Power System Laboratory, Inha University</p>
        <p>#628(Lab.), #627(Prof.), Hitech Center, Inha University,</p>
        <p>100 Inha-Ro, Michuhol-Gu, Incheon, 22212, Republic of Korea</p>
        <p>Tel. +82-32-872-7404(Lab.), +82-32-860-7404(Prof.)</p>
        {contactEmail && (
          <p>
            Email.{' '}
            <a href={`mailto:${contactEmail}`} className="underline hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
              {contactEmail}
            </a>
          </p>
        )}
      </div>
      <p>&copy; {new Date().getFullYear()} IPSL 대학원 졸업생 모임</p>
      <button onClick={openTermsModal} className="underline hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
        이용약관 및 개인정보처리방침
      </button>
    </footer>
  );
}
