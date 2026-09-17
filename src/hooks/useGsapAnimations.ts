import { useLayoutEffect, RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

// Failsafe: força exibição de todo conteúdo
export function forceShowAll(root: HTMLElement | null) {
  if (!root) return;
  root.querySelectorAll('*').forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (
      htmlEl.style.visibility === 'hidden' ||
      htmlEl.style.opacity === '0' ||
      htmlEl.style.transform
    ) {
      gsap.set(htmlEl, { clearProps: 'opacity,visibility,transform' });
    }
  });
}

export function useGsapAnimations(rootRef: RefObject<HTMLElement>) {
  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const root = rootRef.current;
    if (!root) return;

    // Config mobile
    if (window.matchMedia('(pointer: coarse)').matches) {
      ScrollTrigger.config({
        autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
        ignoreMobileResize: true,
      });
    }

    const ctx = gsap.context(() => {
      try {
        const q = gsap.utils.selector(rootRef);

        // === HERO COREOGRAFADO ===
        initHero(q, rootRef);

        // === REVEALS DE SEÇÃO (padrão seguro) ===
        initSectionReveals(q);

        // === SCROLLYTELLING DA TRANSMISSÃO ===
        initTransmissionScrollytelling(q, rootRef);

        // === IMAGENS COM REVEAL DE CANTO ===
        initImageReveals(q);

        // === LOOPS AMBIENTES ===
        initAmbientLoops(q);

        // === MICRO-INTERAÇÕES ===
        initMicroInteractions(q, rootRef);

        // === FAILSAFE: fonts + resize ===
        document.fonts?.ready.then(() => {
          ScrollTrigger.refresh();
        });

        let resizeTimer: number;
        window.addEventListener('resize', () => {
          clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(() => {
            ScrollTrigger.refresh();
          }, 250);
        });

        // === FAILSAFE: após 3s, força exibir se algo estiver oculto ===
        window.addEventListener('load', () => {
          setTimeout(() => {
            forceShowAll(root);
          }, 3000);
        });

      } catch (e) {
        console.error('Animação falhou — exibindo conteúdo:', e);
        forceShowAll(root);
      }
    }, rootRef);

    // === FAILSAFE: erro global de JS ===
    const errorHandler = () => forceShowAll(root);
    window.addEventListener('error', errorHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      ctx.revert();
    };
  }, [rootRef]);
}

// === HERO ===
function initHero(q: ReturnType<typeof gsap.utils.selector>, rootRef: RefObject<HTMLElement>) {
  const hero = q('#inicio')[0];
  if (!hero) return;

  const tl = gsap.timeline({ delay: 0.3 });

  // SplitText no título
  const title = q('#inicio h1')[0];
  if (title) {
    const split = new SplitText(title, { type: 'chars' });
    gsap.set(split.chars, { autoAlpha: 0, y: 24 });
    tl.to(split.chars, {
      autoAlpha: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.02,
      ease: 'power2.out',
    }, 0);
  }

  // Eyebrow
  const eyebrow = q('#inicio .eyebrow')[0];
  if (eyebrow) {
    gsap.set(eyebrow, { autoAlpha: 0, y: 10 });
    tl.to(eyebrow, {
      autoAlpha: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
    }, 0.2);
  }

  // Handwritten
  const handwritten = q('#inicio .handwritten')[0];
  if (handwritten) {
    gsap.set(handwritten, { autoAlpha: 0, y: 10 });
    tl.to(handwritten, {
      autoAlpha: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
    }, 0.3);
  }

  // Lead
  const lead = q('#inicio .lead')[0];
  if (lead) {
    gsap.set(lead, { autoAlpha: 0, y: 10 });
    tl.to(lead, {
      autoAlpha: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
    }, 0.4);
  }

  // Actions
  const actions = q('#inicio .actions')[0];
  if (actions) {
    gsap.set(actions, { autoAlpha: 0, y: 10 });
    tl.to(actions, {
      autoAlpha: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
    }, 0.5);
  }

  // Hero art
  const heroArt = q('#inicio .hero-art')[0];
  if (heroArt) {
    gsap.set(heroArt, { autoAlpha: 0, scale: 0.95 });
    tl.to(heroArt, {
      autoAlpha: 1,
      scale: 1,
      duration: 1,
      ease: 'power2.out',
    }, 0.3);
  }

  // Parallax com scrub
  const sunDisc = q('#inicio .sun-disc')[0];
  if (sunDisc) {
    gsap.to(sunDisc, {
      y: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
      },
    });
  }

  const heroPicture = q('#inicio .hero-picture')[0];
  if (heroPicture) {
    gsap.to(heroPicture, {
      y: -30,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
      },
    });
  }

  const foliage = q('#inicio .foliage-hero')[0];
  if (foliage) {
    gsap.to(foliage, {
      y: -80,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.4,
      },
    });
  }

  const floatingNote = q('#inicio .floating-note')[0];
  if (floatingNote) {
    gsap.to(floatingNote, {
      y: -100,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.3,
      },
    });
  }
}

// === REVEALS DE SEÇÃO (padrão seguro) ===
function initSectionReveals(q: ReturnType<typeof gsap.utils.selector>) {
  const targets = q('.reveal, .section-heading, .info-card, .cycle-card, .team-grid li');
  
  gsap.set(targets, { autoAlpha: 0, y: 42 });
  
  targets.forEach((el) => {
    gsap.to(el, {
      autoAlpha: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none',
        once: true,
      },
    });
  });

  // Eyebrows com clip-path
  const eyebrows = q('.eyebrow');
  eyebrows.forEach((eyebrow) => {
    gsap.set(eyebrow, { clipPath: 'inset(0% 100% 0% 0%)' });
    gsap.to(eyebrow, {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: eyebrow,
        start: 'top 85%',
        toggleActions: 'play none none none',
        once: true,
      },
    });
  });
}

// === SCROLLYTELLING DA TRANSMISSÃO ===
function initTransmissionScrollytelling(
  q: ReturnType<typeof gsap.utils.selector>,
  rootRef: RefObject<HTMLElement>
) {
  const section = q('#transmissao')[0];
  if (!section) return;

  const isDesktop = window.matchMedia('(min-width: 900px)').matches;

  if (isDesktop) {
    const cards = q('#transmissao .cycle-card');
    gsap.set(cards, { autoAlpha: 0, y: 30 });

    // Timeline única com pin
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=150%',
        pin: true,
        scrub: 0.35,
        anticipatePin: 1,
      },
    });

    // Cards revezando dentro da timeline
    if (cards[0]) {
      tl.to(cards[0], { autoAlpha: 1, y: 0, duration: 1 });
    }
    if (cards[1]) {
      tl.to(cards[1], { autoAlpha: 1, y: 0, duration: 1 }, 0.5);
    }

    // Barra de progresso
    const progressBar = document.createElement('div');
    progressBar.style.cssText = 'position:absolute;top:20px;right:20px;width:4px;height:100px;background:var(--line);border-radius:2px;overflow:hidden;z-index:10;';
    const progressFill = document.createElement('div');
    progressFill.style.cssText = 'width:100%;height:0%;background:var(--yellow);transition:height .1s;';
    progressBar.appendChild(progressFill);
    section.style.position = 'relative';
    section.appendChild(progressBar);

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=150%',
      onUpdate: (self) => {
        progressFill.style.height = `${self.progress * 100}%`;
      },
    });
  } else {
    // Mobile: reveals simples
    const cards = q('#transmissao .cycle-card');
    gsap.set(cards, { autoAlpha: 0, y: 30 });
    
    cards.forEach((card) => {
      gsap.to(card, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none none',
          once: true,
        },
      });
    });
  }
}

// === IMAGENS COM REVEAL DE CANTO ===
function initImageReveals(q: ReturnType<typeof gsap.utils.selector>) {
  const images = q('.wildlife-picture, .vaccine-picture, .hero-picture');

  images.forEach((img) => {
    gsap.set(img, { clipPath: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)' });
    gsap.to(img, {
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      duration: 1.2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: img,
        start: 'top 80%',
        toggleActions: 'play none none none',
        once: true,
      },
    });

    // Parallax interno
    const imgElement = img.querySelector('img');
    if (imgElement) {
      gsap.to(imgElement, {
        y: -20,
        ease: 'none',
        scrollTrigger: {
          trigger: img,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.5,
        },
      });
    }
  });
}

// === LOOPS AMBIENTES ===
function initAmbientLoops(q: ReturnType<typeof gsap.utils.selector>) {
  // Folhagens balançando
  const foliages = q('.foliage');
  foliages.forEach((foliage) => {
    const tl = gsap.to(foliage, {
      rotation: '+=3',
      duration: 4,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    ScrollTrigger.create({
      trigger: foliage,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => tl.play(),
      onLeave: () => tl.pause(),
      onEnterBack: () => tl.play(),
      onLeaveBack: () => tl.pause(),
    });
  });

  // Sol respirando
  const sunDisc = q('.sun-disc')[0];
  if (sunDisc) {
    const sunTl = gsap.to(sunDisc, {
      scale: 1.03,
      duration: 3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    ScrollTrigger.create({
      trigger: sunDisc,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => sunTl.play(),
      onLeave: () => sunTl.pause(),
      onEnterBack: () => sunTl.play(),
      onLeaveBack: () => sunTl.pause(),
    });
  }

  // Nota flutuante
  const floatingNote = q('.floating-note')[0];
  if (floatingNote) {
    const noteTl = gsap.to(floatingNote, {
      y: '-=10',
      duration: 3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    ScrollTrigger.create({
      trigger: floatingNote,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => noteTl.play(),
      onLeave: () => noteTl.pause(),
      onEnterBack: () => noteTl.play(),
      onLeaveBack: () => noteTl.pause(),
    });
  }
}

// === MICRO-INTERAÇÕES ===
function initMicroInteractions(
  q: ReturnType<typeof gsap.utils.selector>,
  rootRef: RefObject<HTMLElement>
) {
  // Magnetic hover em botões (desktop only)
  if (!window.matchMedia('(pointer: coarse)').matches) {
    const buttons = q('.button, .text-link').filter((el): el is HTMLElement => el instanceof HTMLElement);
    buttons.forEach((button) => {
      button.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(button, {
          x: x * 0.1,
          y: y * 0.1,
          duration: 0.3,
          ease: 'power2.out',
        });
      });

      button.addEventListener('mouseleave', () => {
        gsap.to(button, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.5)',
        });
      });

      button.addEventListener('mousedown', () => {
        gsap.to(button, {
          scale: 0.97,
          duration: 0.1,
        });
      });

      button.addEventListener('mouseup', () => {
        gsap.to(button, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
        });
      });
    });

    // Tilt 3D em cards
    const cards = q('.info-card, .cycle-card, .kpi-card, .stat-mini-card').filter((el): el is HTMLElement => el instanceof HTMLElement);
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const rotateX = (y - 0.5) * -4;
        const rotateY = (x - 0.5) * 4;

        gsap.to(card, {
          rotateX,
          rotateY,
          duration: 0.3,
          ease: 'power2.out',
          transformPerspective: 1000,
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.5,
          ease: 'power2.out',
        });
      });
    });
  }

  // Header compacto ao rolar
  const header = q('.header')[0];
  if (header) {
    ScrollTrigger.create({
      start: 100,
      onUpdate: (self) => {
        if (self.direction === 1 && self.scroll() > 100) {
          gsap.to(header, {
            height: 70,
            duration: 0.3,
            ease: 'power2.out',
          });
        } else if (self.scroll() < 100) {
          gsap.to(header, {
            height: 90,
            duration: 0.3,
            ease: 'power2.out',
          });
        }
      },
    });
  }
}
