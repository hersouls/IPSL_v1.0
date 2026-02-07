import { useEffect } from 'react';
import { useUiStore } from '../stores/uiStore';

export function useDarkMode() {
  const isDark = useUiStore(s => s.isDark);
  const setDark = useUiStore(s => s.setDark);

  useEffect(() => {
    // Apply initial state
    document.documentElement.classList.toggle('dark', isDark);

    // Listen for system preference changes (only if no explicit setting)
    const stored = localStorage.getItem('ipsl_darkMode');
    if (!stored) {
      const mq = window.matchMedia('(prefers-color-scheme:dark)');
      const handler = (e: MediaQueryListEvent) => setDark(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [isDark, setDark]);
}
