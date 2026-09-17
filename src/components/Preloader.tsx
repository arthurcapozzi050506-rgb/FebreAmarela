import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const preloaderRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasVisited = sessionStorage.getItem('hasVisited');
    const hasScrolled = window.scrollY > 0;

    // Pular preloader se necessário
    if (prefersReduced || hasVisited || hasScrolled) {
      setIsVisible(false);
      onComplete();
      return;
    }

    // Marcar como visitado
    sessionStorage.setItem('hasVisited', 'true');

    // Animação do preloader
    const tl = gsap.timeline({
      onComplete: () => {
        setIsVisible(false);
        onComplete();
      },
    });

    // Marca animando
    tl.fromTo(markRef.current, 
      { scale: 0, rotation: -180 },
      { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.7)' }
    );

    // Pausa breve
    tl.to({}, { duration: 0.3 });

    // Cortinas revelando (amarelo → verde → creme)
    tl.to(preloaderRef.current, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
      duration: 0.8,
      ease: 'power2.inOut',
    });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      ref={preloaderRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'linear-gradient(135deg, var(--yellow) 0%, var(--green) 50%, var(--cream) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      }}
    >
      <div
        ref={markRef}
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'var(--yellow)',
          display: 'grid',
          placeItems: 'center',
          fontSize: '3rem',
          color: 'var(--green)',
          boxShadow: '0 20px 60px rgba(20, 63, 48, 0.3)',
        }}
      >
        ✚
      </div>
    </div>
  );
}
