/** Format number with commas */
export function fmt(n: number | undefined | null): string {
  return (n || 0).toLocaleString();
}

/** Format number as 만 원 (10,000 KRW unit) */
export function fmtMan(v: number): string {
  const m = v / 10000;
  return Number(Number.isInteger(m) ? m : m.toFixed(1)).toLocaleString();
}

/** Format phone number with dashes */
export function fmtPhone(value: string): string {
  let v = value.replace(/[^0-9]/g, '');
  if (v.length > 3 && v.length <= 7) {
    v = v.replace(/(\d{3})(\d{1,4})/, '$1-$2');
  } else if (v.length > 7) {
    if (v.startsWith('02')) {
      v = v.replace(/(\d{2})(\d{3,4})(\d{4})/, '$1-$2-$3');
    } else {
      v = v.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
    }
  }
  return v;
}

/** Parse formatted number string (remove commas) */
export function parseFmt(v: string): number {
  return parseInt(v.replace(/,/g, '')) || 0;
}

/** Format input value with commas (for controlled inputs) */
export function fmtInputValue(value: string): string {
  const v = value.replace(/[^0-9]/g, '');
  return v ? Number(v).toLocaleString() : '';
}
