import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

export function useAnimations() {
  const ctx = useRef<gsap.Context | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Config mobile
    if (window.matchMedia('(pointer: coarse)').matches) {
      ScrollTrigger.config({
        autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
        ignoreMobileResize: true,
      });
    }

    // Aguardar um frame para garantir que o DOM está pronto
    const initTimeout = setTimeout(() => {
      ctx.current = gsap.context(() => {
        // Hero coreografado
        initHero();
        
        // Reveals de seção
        initSectionReveals();
        
        // Scrollytelling da transmissão
        initTransmissionScrollytelling();
        
        // Imagens com reveal de canto
        initImageReveals();
        
        // Loops ambientes
        initAmbientLoops();
        
        // Micro-interações
        initMicroInteractions();
        
        // Refresh após fontes
        document.fonts.ready.then(() => {
          ScrollTrigger.refresh();
        });

        // Debounce resize
        let resizeTimer: number;
        window.addEventListener('resize', () => {
          clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(() => {
            ScrollTrigger.refresh();
          }, 250);
        });
      });
    }, 100);

    return () => {
      clearTimeout(initTimeout);
      ctx.current?.revert();
    };
  }, []);
}

function initHero() {
  const hero = document.querySelector('#inicio');
  if (!hero) return;

  const tl = gsap.timeline({ delay: 0.3 });

  // SplitText no título
  const title = hero.querySelector('h1');
  if (title) {
    const split = new SplitText(title, { type: 'chars' });
    tl.from(split.chars, {
      autoAlpha: 0,
      y: 24,
      duration: 0.8,
      stagger: 0.02,
      ease: 'power2.out',
    }, 0);
  }

  // Eyebrow
  const eyebrow = hero.querySelector('.eyebrow');
  if (eyebrow) {
    tl.from(eyebrow, {
      autoAlpha: 0,
      y: 10,
      duration: 0.6,
      ease: 'power2.out',
    }, 0.2);
  }

  // Handwritten
  const handwritten = hero.querySelector('.handwritten');
  if (handwritten) {
    tl.from(handwritten, {
      autoAlpha: 0,
      y: 10,
      duration: 0.6,
      ease: 'power2.out',
    }, 0.3);
  }

  // Lead
  const lead = hero.querySelector('.lead');
  if (lead) {
    tl.from(lead, {
      autoAlpha: 0,
      y: 10,
      duration: 0.6,
      ease: 'power2.out',
    }, 0.4);
  }

  // Actions
  const actions = hero.querySelector('.actions');
  if (actions) {
    tl.from(actions, {
      autoAlpha: 0,
      y: 10,
      duration: 0.6,
      ease: 'power2.out',
    }, 0.5);
  }

  // Hero art
  const heroArt = hero.querySelector('.hero-art');
  if (heroArt) {
    tl.from(heroArt, {
      autoAlpha: 0,
      scale: 0.95,
      duration: 1,
      ease: 'power2.out',
    }, 0.3);
  }

  // Parallax com scrub
  const sunDisc = hero.querySelector('.sun-disc');
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

  const heroPicture = hero.querySelector('.hero-picture');
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

  const foliage = hero.querySelector('.foliage-hero');
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

  const floatingNote = hero.querySelector('.floating-note');
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

function initSectionReveals() {
  const sections = document.querySelectorAll('.section, .transmission, .vaccine-section, .location-section');
  
  sections.forEach(section => {
    const reveals = section.querySelectorAll('.reveal, .section-heading, .info-card, .cycle-card, .team-grid li');
    
    if (reveals.length > 0) {
      gsap.from(reveals, {
        autoAlpha: 0,
        y: 42,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
    }

    // Eyebrows com clip-path
    const eyebrows = section.querySelectorAll('.eyebrow');
    eyebrows.forEach(eyebrow => {
      gsap.from(eyebrow, {
        clipPath: 'inset(0% 100% 0% 0%)',
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: eyebrow,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });
  });
}

function initTransmissionScrollytelling() {
  const transmission = document.querySelector('#transmissao');
  if (!transmission) return;

  const isDesktop = window.matchMedia('(min-width: 900px)').matches;
  
  if (isDesktop) {
    // Pin da seção com scrub
    ScrollTrigger.create({
      trigger: transmission,
      start: 'top top',
      end: '+=150%',
      pin: true,
      scrub: 0.35,
    });

    // Cards revezando
    const cards = transmission.querySelectorAll('.cycle-card');
    cards.forEach((card, i) => {
      gsap.fromTo(card,
        { autoAlpha: 0, y: 30 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          scrollTrigger: {
            trigger: transmission,
            start: `top+=${i * 50}% top`,
            end: `top+=${(i + 1) * 50}% top`,
            scrub: true,
          },
        }
      );
    });

    // Barra de progresso
    const progressBar = document.createElement('div');
    progressBar.style.cssText = 'position:absolute;top:20px;right:20px;width:4px;height:100px;background:var(--line);border-radius:2px;overflow:hidden;z-index:10;';
    const progressFill = document.createElement('div');
    progressFill.style.cssText = 'width:100%;height:0%;background:var(--yellow);transition:height .1s;';
    progressBar.appendChild(progressFill);
    transmission.appendChild(progressBar);

    ScrollTrigger.create({
      trigger: transmission,
      start: 'top top',
      end: '+=150%',
      onUpdate: (self) => {
        progressFill.style.height = `${self.progress * 100}%`;
      },
    });
  } else {
    // Mobile: reveals simples
    const cards = transmission.querySelectorAll('.cycle-card');
    gsap.from(cards, {
      autoAlpha: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: transmission,
        start: 'top 70%',
        toggleActions: 'play none none none',
      },
    });
  }
}

function initImageReveals() {
  const images = document.querySelectorAll('.wildlife-picture, .vaccine-picture, .hero-picture');
  
  images.forEach(img => {
    gsap.from(img, {
      clipPath: 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
      duration: 1.2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: img,
        start: 'top 80%',
        toggleActions: 'play none none none',
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

function initAmbientLoops() {
  // Folhagens balançando
  const foliages = document.querySelectorAll('.foliage');
  foliages.forEach(foliage => {
    const tl = gsap.to(foliage, {
      rotation: '+=3',
      duration: 4,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    // Pausar quando fora de vista
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
  const sunDisc = document.querySelector('.sun-disc');
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
  const floatingNote = document.querySelector('.floating-note');
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

function initMicroInteractions() {
  // Magnetic hover em botões (desktop only)
  if (!window.matchMedia('(pointer: coarse)').matches) {
    const buttons = document.querySelectorAll<HTMLElement>('.button, .text-link');
    buttons.forEach(button => {
      button.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = (button as HTMLElement).getBoundingClientRect();
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
    const cards = document.querySelectorAll<HTMLElement>('.info-card, .cycle-card, .kpi-card, .stat-mini-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = (card as HTMLElement).getBoundingClientRect();
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
  const header = document.querySelector('.header');
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
