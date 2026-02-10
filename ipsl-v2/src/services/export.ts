import * as XLSX from 'xlsx';
import type { Member, Transaction, Event as IEvent, Fees, Settings, Schedule } from '../types';
import { MONTHS, SUPPORT_CATS, SCHEDULE_LABELS } from '../constants';
import type { SupportCategoryKey } from '../types';

export function exportMembersExcel(members: Member[]): boolean {
  if (members.length === 0) return false;
  const data = members.map(m => ({
    이름: m.name, 기수: m.cohort, 직책: m.role, 연락처: m.phone, 이메일: m.email, 메모: m.memo,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '회원명부');
  XLSX.writeFile(wb, `IPSL_회원명부_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}

export function exportFeesExcel(members: Member[], fees: Fees, year: string): boolean {
  if (members.length === 0) return false;
  const data = members.map(m => {
    const row: Record<string, string | number> = { 이름: m.name, 기수: m.cohort || '' };
    let totalAmt = 0;
    MONTHS.forEach((mn, mi) => {
      const amt = fees[year]?.[m.id]?.[mi] || 0;
      row[mn] = amt > 0 ? amt.toLocaleString() + '원' : '미납';
      totalAmt += amt;
    });
    row['납부합계'] = totalAmt.toLocaleString() + '원';
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, year + '년 회비');
  XLSX.writeFile(wb, `IPSL_회비관리_${year}.xlsx`);
  return true;
}

export function exportToJSON(
  settings: Settings, members: Member[], fees: Fees,
  transactions: Transaction[], events: IEvent[], schedules: Schedule[] = [],
) {
  const safeMembers = members.map(({ pin, ...rest }) => rest);
  const data = { settings, members: safeMembers, fees, transactions, events, schedules, exportDate: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `IPSL_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAllToExcel(
  members: Member[], fees: Fees, transactions: Transaction[],
  events: IEvent[], year: string, schedules: Schedule[] = [],
) {
  const wb = XLSX.utils.book_new();

  const mData = members.map(m => ({
    이름: m.name, 기수: m.cohort, 직책: m.role, 연락처: m.phone, 이메일: m.email, 메모: m.memo,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mData), '회원명부');

  const fData = members.map(m => {
    const row: Record<string, string | number> = { 이름: m.name };
    let t = 0;
    MONTHS.forEach((mn, i) => {
      const v = fees[year]?.[m.id]?.[i] || 0;
      row[mn] = v; t += v;
    });
    row['합계'] = t;
    return row;
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fData), year + '년 회비');

  const tData = transactions.map(t => ({
    날짜: t.date, 구분: t.type === 'deposit' ? '입금' : '사용',
    카테고리: t.category || '-', 내용: t.description, 금액: t.amount,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tData), '입출금내역');

  const eData = events.map(e => ({
    날짜: e.date, 카테고리: SUPPORT_CATS[e.category as SupportCategoryKey]?.label || e.category,
    제목: e.title, 대상: e.targetMember ? members.find(m => m.id === e.targetMember)?.name : '',
    장소: e.location, 금액: e.amount, 메모: e.memo,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eData), '지원내역');

  if (schedules.length > 0) {
    const sData = schedules.map(s => ({
      날짜: s.date, 분류: SCHEDULE_LABELS[s.scheduleLabel]?.label || s.scheduleLabel,
      제목: s.title, 시작: s.startTime || '-', 종료: s.endTime || '-',
      장소: s.location || '-', 메모: s.memo || '-',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sData), '일정');
  }

  XLSX.writeFile(wb, `IPSL_Full_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export interface ImportData {
  settings?: Settings;
  members?: Member[];
  fees?: Fees;
  transactions?: Transaction[];
  events?: IEvent[];
  schedules?: Schedule[];
}

export function parseImportFile(file: File): Promise<ImportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsText(file);
  });
}
