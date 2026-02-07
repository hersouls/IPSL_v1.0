import { useState } from 'react';
import { Plus, Search, Download, Pencil, Trash2, Building2, Cake, Phone, Mail, Briefcase } from 'lucide-react';
import { useMemberStore } from '../../stores/memberStore';
import { useFeeStore } from '../../stores/feeStore';
import { useUiStore } from '../../stores/uiStore';
import { exportMembersExcel } from '../../services/export';
import EmptyState from '../ui/EmptyState';

export default function MembersPanel() {
  const members = useMemberStore(s => s.members);
  const { openMemberModal } = useUiStore();
  const deleteMember = useMemberStore(s => s.deleteMember);
  const showToast = useUiStore(s => s.showToast);
  const deleteMemberFees = useFeeStore(s => s.deleteMemberFees);
  const [query, setQuery] = useState('');

  const filtered = members
    .filter(m => (m.name || '').toLowerCase().includes(query.toLowerCase()) || (m.cohort || '').toLowerCase().includes(query.toLowerCase()) || (m.phone || '').includes(query))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`${name}님을 삭제하시겠습니까?`)) return;
    deleteMemberFees(id);
    deleteMember(id);
    showToast('회원이 삭제되었습니다');
  };

  return (
    <main className="max-w-4xl mx-auto px-5 py-8 w-full space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">회원명부</h2>
          <span className="text-sm text-zinc-500">총 {members.length}명</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportMembersExcel(members)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors">
            <Download className="w-3.5 h-3.5" />엑셀
          </button>
          <button onClick={() => openMemberModal()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-navy-600 text-white hover:bg-navy-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />회원 추가
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="이름, 기수, 연락처 검색..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="등록된 회원이 없습니다." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((m, di) => {
            const initial = (m.name || '?').charAt(0);
            const roleColor = ['회장', '총무', '감사'].includes(m.role)
              ? 'bg-navy-100 dark:bg-navy-900/30 text-navy-700 dark:text-navy-400'
              : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400';
            return (
              <div key={m.id} className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 card-hover animate-fade-in" style={{ animationDelay: `${di * 30}ms` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {m.avatar ? (
                      <img src={m.avatar} alt={m.name} className="w-10 h-10 rounded-xl object-cover border border-navy-200 dark:border-navy-800" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-navy-100 dark:bg-navy-900/30 flex items-center justify-center text-sm font-bold text-navy-600 dark:text-navy-400 border border-navy-200 dark:border-navy-800">{initial}</div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm">{m.name} <span className="text-[10px] font-normal text-zinc-400 ml-0.5">{m.degree || ''}</span></h4>
                      <p className="text-xs text-zinc-500">{m.cohort || '-'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${roleColor}`}>{m.role}</span>
                </div>
                {m.company && <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-1"><Building2 className="w-3 h-3" />{m.company}</p>}
                {m.birthday && <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-1"><Cake className="w-3 h-3" />{m.birthday}</p>}
                {m.phone && <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-1"><Phone className="w-3 h-3" />{m.phone}</p>}
                {m.email && <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-1"><Mail className="w-3 h-3" />{m.email}</p>}
                {m.emailCompany && <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-1"><Briefcase className="w-3 h-3" />{m.emailCompany}</p>}
                <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700">
                  <button onClick={() => openMemberModal(m.id)} className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-zinc-50 dark:bg-zinc-700/50 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1"><Pencil className="w-3 h-3" />수정</button>
                  <button onClick={() => handleDelete(m.id, m.name)} className="flex-1 py-1.5 text-xs font-semibold rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" />삭제</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
