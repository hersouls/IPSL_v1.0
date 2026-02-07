import { useEffect, useRef } from 'react';

export function useFadeIn<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            (e.target as HTMLElement).style.opacity = '';
            (e.target as HTMLElement).style.transform = '';
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return ref;
}
