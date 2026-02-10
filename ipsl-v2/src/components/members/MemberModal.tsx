import { useState, useEffect, useRef } from 'react';
import { Camera, X, Eye, EyeOff } from 'lucide-react';
import Modal from '../ui/Modal';
import { useMemberStore } from '../../stores/memberStore';
import { useUiStore } from '../../stores/uiStore';
import { fmtPhone } from '../../utils/format';
import { COHORT_START_YEAR, DEFAULT_MEMBER_PIN } from '../../constants';

function resizeImage(file: File, maxSize = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d')!;

        // Center-crop to square
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, maxSize, maxSize);

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MemberModal() {
  const { memberModalOpen, editMemberId, closeMemberModal } = useUiStore();
  const members = useMemberStore(s => s.members);
  const addMember = useMemberStore(s => s.addMember);
  const updateMember = useMemberStore(s => s.updateMember);
  const showToast = useUiStore(s => s.showToast);

  const existing = editMemberId ? members.find(m => m.id === editMemberId) : null;
  const isEdit = !!existing;

  const [name, setName] = useState('');
  const [degree, setDegree] = useState('Ph.D.');
  const [cohort, setCohort] = useState('');
  const [role, setRole] = useState('일반회원');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emailCompany, setEmailCompany] = useState('');
  const [company, setCompany] = useState('');
  const [birthday, setBirthday] = useState('');
  const [memo, setMemo] = useState('');
  const [avatar, setAvatar] = useState('');
  const [pin, setPin] = useState(DEFAULT_MEMBER_PIN);
  const [showPin, setShowPin] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const endYear = new Date().getFullYear() + 1;
  const cohorts: string[] = [];
  for (let y = endYear; y >= COHORT_START_YEAR; y--) {
    const gen = y - 2008;
    cohorts.push(`${gen}기 (${y}년)`);
  }

  useEffect(() => {
    if (memberModalOpen) {
      if (existing) {
        setName(existing.name || '');
        setDegree(existing.degree || 'Ph.D.');
        setCohort(existing.cohort || '');
        setRole(existing.role || '일반회원');
        setPhone(existing.phone || '');
        setEmail(existing.email || '');
        setEmailCompany(existing.emailCompany || '');
        setCompany(existing.company || '');
        setBirthday(existing.birthday || '');
        setMemo(existing.memo || '');
        setAvatar(existing.avatar || '');
        setPin(existing.pin || DEFAULT_MEMBER_PIN);
        setShowPin(false);
      } else {
        setName(''); setDegree('Ph.D.'); setCohort(cohorts[0] || ''); setRole('일반회원');
        setPhone(''); setEmail(''); setEmailCompany(''); setCompany(''); setBirthday(''); setMemo('');
        setAvatar('');
        setPin(DEFAULT_MEMBER_PIN);
        setShowPin(false);
      }
    }
  }, [memberModalOpen, editMemberId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('이미지 파일만 선택할 수 있습니다.');
      return;
    }
    try {
      const dataUrl = await resizeImage(file);
      setAvatar(dataUrl);
    } catch {
      showToast('이미지 처리에 실패했습니다.');
    }
    // Reset file input
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) { showToast('이름은 필수입니다.'); return; }
    const dupe = members.find(m => m.name === trimmed && m.id !== editMemberId);
    if (dupe) { showToast(`이미 등록된 이름입니다 (${dupe.cohort || '기수미정'}).`); return; }

    const data = {
      name: trimmed, degree, cohort, role,
      phone: phone.trim(), email: email.trim(), emailCompany: emailCompany.trim(),
      company: company.trim(), birthday: birthday.trim(), memo: memo.trim(),

      ...(avatar ? { avatar } : {}),
      pin: pin || DEFAULT_MEMBER_PIN,
    };

    if (isEdit && editMemberId) {
      updateMember(editMemberId, data);
      showToast('회원 정보가 수정되었습니다');
    } else {
      addMember(data as any);
      showToast('새 회원이 등록되었습니다');
    }
    closeMemberModal();
  };

  const initial = (name || '?').charAt(0);

  return (
    <Modal open={memberModalOpen} onClose={closeMemberModal} title={isEdit ? '회원 수정' : '회원 추가'}>
      <div className="space-y-4">
        {/* Avatar upload */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative group">
            {avatar ? (
              <img src={avatar} alt="아바타" className="w-20 h-20 rounded-2xl object-cover border-2 border-navy-200 dark:border-navy-800" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-navy-100 dark:bg-navy-900/30 flex items-center justify-center text-2xl font-bold text-navy-600 dark:text-navy-400 border-2 border-navy-200 dark:border-navy-800">
                {initial}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors"
            >
              <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            {avatar && (
              <button
                type="button"
                onClick={() => setAvatar('')}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-[11px] text-navy-600 dark:text-navy-400 font-semibold hover:underline"
          >
            {avatar ? '사진 변경' : '프로필 사진 추가'}
          </button>
        </div>

        <Field label="이름 *">
          <input value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="홍길동" />
        </Field>
        <Field label="비밀번호 (4자리) *">
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="input-field pr-10 tracking-widest"
              placeholder="0000"
              maxLength={4}
              inputMode="numeric"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="학위">
            <select value={degree} onChange={e => setDegree(e.target.value)} className="input-field">
              <option>Ph.D.</option><option>M.S.</option><option>B.S.</option>
            </select>
          </Field>
          <Field label="기수">
            <select value={cohort} onChange={e => setCohort(e.target.value)} className="input-field">
              {cohorts.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="직책">
          <select value={role} onChange={e => setRole(e.target.value)} className="input-field">
            <option>일반회원</option><option>회장</option><option>총무</option><option>감사</option><option>개발자</option>
          </select>
        </Field>
        <Field label="전화번호">
          <input value={phone} onChange={e => setPhone(fmtPhone(e.target.value))} className="input-field" placeholder="010-1234-5678" />
        </Field>
        <Field label="이메일">
          <input value={email} onChange={e => setEmail(e.target.value)} className="input-field" type="email" />
        </Field>
        <Field label="회사 이메일">
          <input value={emailCompany} onChange={e => setEmailCompany(e.target.value)} className="input-field" type="email" />
        </Field>
        <Field label="소속기관">
          <input value={company} onChange={e => setCompany(e.target.value)} className="input-field" />
        </Field>
        <Field label="생일">
          <input value={birthday} onChange={e => setBirthday(e.target.value)} className="input-field" type="date" />
        </Field>
        <Field label="메모">
          <textarea value={memo} onChange={e => setMemo(e.target.value)} className="input-field" rows={2} />
        </Field>
        <button onClick={handleSave} className="w-full py-3 rounded-xl text-sm font-bold bg-navy-600 text-white hover:bg-navy-700 transition-colors">
          {isEdit ? '수정하기' : '등록하기'}
        </button>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
