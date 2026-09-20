import { useEffect, useRef, useState, useCallback } from 'react';
import StatsSection from './components/StatsSection';
import Preloader from './components/Preloader';
import { useGsapAnimations } from './hooks/useGsapAnimations';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizSelected, setQuizSelected] = useState<boolean | null>(null);
  const [progress, setProgress] = useState(0);
  const [preloaderComplete, setPreloaderComplete] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Hook de animações com rootRef como escopo
  useGsapAnimations(rootRef);

  // Intersection Observer for reveal animations
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) document.body.classList.add('js-motion');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Reading progress
  useEffect(() => {
    let frame = false;
    const updateScroll = () => {
      const length = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${length > 0 ? window.scrollY / length : 0})`;
      }
      frame = false;
    };
    const onScroll = () => {
      if (!frame) { requestAnimationFrame(updateScroll); frame = true; }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateScroll);
    updateScroll();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', updateScroll); };
  }, []);

  const questions = [
    { category: 'PREVENÇÃO', text: 'A vacina ajuda a prevenir a febre amarela.', answer: true, explanation: 'A vacinação é a principal medida de prevenção. A equipe de saúde deve conferir as doses indicadas para a idade e o histórico de cada pessoa.', source: 'https://www.gov.br/saude/pt-br/vacinacao/calendario' },
    { category: 'PRIMATAS', text: 'Macacos transmitem febre amarela diretamente para as pessoas.', answer: false, explanation: 'A transmissão ocorre pela picada de mosquitos infectados. Os macacos também são vítimas e ajudam a alertar sobre a circulação do vírus. Proteja os primatas.', source: 'https://www.gov.br/saude/pt-br/acesso-a-informacao/faq/vacinacao-febre-amarela/qual-a-relacao-entre-macacos' },
    { category: 'TRANSMISSÃO', text: 'A febre amarela passa pelo contato direto entre pessoas.', answer: false, explanation: 'Abraçar, conversar ou compartilhar o ambiente não transmite febre amarela. É necessária a picada de um mosquito transmissor infectado.', source: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/f/febre-amarela' },
    { category: 'PROTEÇÃO NO DIA A DIA', text: 'Repelente e roupas que cobrem a pele ajudam a evitar picadas.', answer: true, explanation: 'Essas medidas reduzem a exposição aos mosquitos. Use o repelente conforme o rótulo. Essa proteção complementa os cuidados e não substitui a vacinação quando indicada.', source: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-do-viajante/proteja-se' },
    { category: 'VACINAÇÃO', text: 'Uma única dose é a regra para todas as pessoas, em qualquer idade.', answer: false, explanation: 'O esquema depende da idade e das doses já recebidas. Para crianças, o calendário prevê uma dose aos 9 meses e reforço aos 4 anos. A unidade de saúde avalia cada histórico.', source: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/f/febre-amarela/faq/faq/prevencao-e-vacinacao/quantas-doses-da-vacina-sao' }
  ];

  const handleAnswer = (value: boolean) => {
    if (quizAnswered || quizFinished) return;
    setQuizAnswered(true);
    setQuizSelected(value);
    if (value === questions[quizIndex].answer) setQuizScore(s => s + 1);
  };

  const handleNext = () => {
    if (!quizAnswered) return;
    if (quizIndex >= questions.length - 1) {
      setQuizFinished(true);
    } else {
      setQuizIndex(i => i + 1);
      setQuizAnswered(false);
      setQuizSelected(null);
    }
  };

  const restartQuiz = () => {
    setQuizIndex(0);
    setQuizScore(0);
    setQuizAnswered(false);
    setQuizFinished(false);
    setQuizSelected(null);
  };

  // Game state - useRef como fonte da verdade do loop
  const [gameState, setGameState] = useState<'idle' | 'running' | 'paused' | 'over'>('idle');
  const modeRef = useRef<'idle' | 'running' | 'paused' | 'over'>('idle');
  const [gameScore, setGameScore] = useState(0);
  const [gameLives, setGameLives] = useState(3);
  const [gameTime, setGameTime] = useState(45);
  const gameRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);
  const gameDataRef = useRef<{
    items: any[];
    raf: number;
    last: number;
    spawn: number;
    serial: number;
    pointer: any;
    score: number;
    lives: number;
  }>({ items: [], raf: 0, last: 0, spawn: 0, serial: 0, pointer: null, score: 0, lives: 3 });

  function setGameMode(next: 'idle' | 'running' | 'paused' | 'over') {
    modeRef.current = next;
    setGameState(next);
  }

  const clearGameItems = useCallback(() => {
    gameDataRef.current.items.forEach((i: any) => i.el?.remove());
    gameDataRef.current.items = [];
    gameDataRef.current.pointer = null;
  }, []);

  const createItem = useCallback(() => {
    if (!itemsRef.current) return;
    const layer = itemsRef.current;
    const rand = Math.random();
    const type = rand > 0.85 ? 'bomba' : rand > 0.65 ? 'vacina' : 'mosquito';
    const isMosquito = type === 'mosquito';

    const el = document.createElement('button');
    el.type = 'button';
    el.className = `ninja-item ${type}`;
    el.setAttribute('aria-label', isMosquito ? 'Acertar mosquito' : type === 'bomba' ? 'Bomba: não acertar' : 'Escudo de proteção: não acertar');
    el.innerHTML = `${isMosquito ? '🦟' : type === 'bomba' ? '💣' : '🛡️'}<small>${isMosquito ? 'MOSQUITO' : type === 'bomba' ? 'BOMBA' : 'PROTEÇÃO'}</small>`;

    const arena = layer.parentElement;
    if (!arena) return;
    const w = arena.clientWidth;
    const h = arena.clientHeight;
    const size = 62;

    const item = {
      id: ++gameDataRef.current.serial,
      el,
      mosquito: isMosquito,
      type,
      x: Math.random() * Math.max(1, w - size),
      y: h + size,
      vx: (Math.random() - 0.5) * 100,
      vy: -Math.sqrt(2 * 700 * (h * 0.8 + size)),
      age: 0,
    };

    el.addEventListener('click', () => hitItem(item));
    layer.append(el);
    gameDataRef.current.items.push(item);
    positionItem(item);
  }, []);

  const positionItem = (item: any) => {
    item.el.style.transform = `translate(${item.x}px, ${item.y}px)`;
  };

  const removeItem = (item: any) => {
    gameDataRef.current.items = gameDataRef.current.items.filter((i: any) => i !== item);
    item.el.remove();
  };

  const hitItem = useCallback((item: any) => {
    if (modeRef.current !== 'running' || !gameDataRef.current.items.includes(item)) return;
    removeItem(item);

    if (item.mosquito) {
      gameDataRef.current.score += 10;
      setGameScore(gameDataRef.current.score);
    } else {
      const damage = item.type === 'bomba' ? 2 : 1;
      gameDataRef.current.lives = Math.max(0, gameDataRef.current.lives - damage);
      setGameLives(gameDataRef.current.lives);
      if (gameDataRef.current.lives <= 0) {
        setGameMode('over');
        cancelAnimationFrame(gameDataRef.current.raf);
        clearGameItems();
      }
    }
  }, [clearGameItems]);

  const startGame = useCallback(() => {
    cancelAnimationFrame(gameDataRef.current.raf);
    clearGameItems();
    setGameScore(0);
    setGameLives(3);
    setGameTime(45);
    gameDataRef.current.score = 0;
    gameDataRef.current.lives = 3;
    gameDataRef.current.spawn = 0.6;
    gameDataRef.current.last = performance.now();
    setGameMode('running');

    const loop = (now: number) => {
      if (modeRef.current !== 'running') {
        gameDataRef.current.raf = requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min((now - gameDataRef.current.last) / 1000, 0.04);
      gameDataRef.current.last = now;

      // Timer
      setGameTime(prev => {
        const next = Math.max(0, prev - dt);
        if (next <= 0) {
          setGameMode('over');
          cancelAnimationFrame(gameDataRef.current.raf);
          clearGameItems();
          return 0;
        }
        return next;
      });

      // Spawn items
      gameDataRef.current.spawn += dt;
      if (gameDataRef.current.spawn >= 1.1) {
        gameDataRef.current.spawn = 0;
        createItem();
      }

      // Update items
      const arena = itemsRef.current?.parentElement;
      if (arena) {
        const arenaH = arena.clientHeight;
        for (const item of [...gameDataRef.current.items]) {
          item.age += dt;
          item.x += item.vx * dt;
          item.y += item.vy * dt;
          item.vy += 700 * dt;

          const max = arena.clientWidth - 62;
          if (item.x < 0 || item.x > max) {
            item.x = Math.max(0, Math.min(max, item.x));
            item.vx = -item.vx;
          }
          positionItem(item);

          // Remove if off screen
          if (item.y > arenaH + 70 && item.vy > 0) {
            removeItem(item);
            if (item.mosquito) {
              gameDataRef.current.lives = Math.max(0, gameDataRef.current.lives - 1);
              setGameLives(gameDataRef.current.lives);
              if (gameDataRef.current.lives <= 0) {
                setGameMode('over');
                cancelAnimationFrame(gameDataRef.current.raf);
                clearGameItems();
                return;
              }
            }
          }
        }
      }

      gameDataRef.current.raf = requestAnimationFrame(loop);
    };
    gameDataRef.current.raf = requestAnimationFrame(loop);
  }, [clearGameItems, createItem]);

  const pauseGame = useCallback(() => {
    if (modeRef.current !== 'running') return;
    setGameMode('paused');
  }, []);

  const resumeGame = useCallback(() => {
    if (modeRef.current !== 'paused') return;
    gameDataRef.current.last = performance.now();
    setGameMode('running');
  }, []);

  return (
    <div className="js-motion" ref={rootRef}>
      <Preloader onComplete={() => setPreloaderComplete(true)} />
      <a className="skip" href="#inicio">Ir para o conteúdo</a>
      <div className="reading-progress" ref={progressRef} aria-hidden="true" style={{ transform: 'scaleX(0)' }}></div>

      {/* Header */}
      <header className="header">
        <a href="#inicio" className="brand">
          <span className="brand-mark">✚</span>
          <span>Febre Amarela<small>INFORMAÇÃO QUE PROTEGE</small></span>
        </a>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}>☰</button>
        <nav id="navigation" className={menuOpen ? 'open' : ''}>
          <a href="#inicio" onClick={() => setMenuOpen(false)}>Início</a>
          <a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre</a>
          <a href="#transmissao" onClick={() => setMenuOpen(false)}>Transmissão</a>
          <a href="#vacinacao" onClick={() => setMenuOpen(false)}>Vacinação</a>
          <a href="#quiz" onClick={() => setMenuOpen(false)}>Quiz</a>
          <a href="#jogo" onClick={() => setMenuOpen(false)}>Jogo</a>
          <a href="#dados" onClick={() => setMenuOpen(false)}>Dados</a>
          <a href="#equipe" onClick={() => setMenuOpen(false)}>Equipe</a>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section id="inicio" className="hero wrap">
          <div className="hero-copy">
            <p className="eyebrow"><span className="tiny-cross">+</span> CONHECER É O PRIMEIRO CUIDADO</p>
            <p className="handwritten">Febre amarela</p>
            <h1>Informação que<br /><em>protege.</em><br />Prevenção que salva.</h1>
            <p className="lead">Entenda a doença, descubra como se prevenir e transforme informação em cuidado — com você e com quem está por perto.</p>
            <div className="actions">
              <a href="#vacinacao" className="button green">Quero me proteger <span>↗</span></a>
              <a href="#sobre" className="text-link">Conhecer a doença <span>↓</span></a>
            </div>
            <p className="academic">PROJETO ACADÊMICO · EDUCAÇÃO EM SAÚDE</p>
          </div>
          <div className="hero-art">
            <div className="sun-disc" aria-hidden="true"></div>
            <div className="hero-picture">
              <img src="https://rough-band-64f8.capozziarthur12.workers.dev/assets/mosquito.jpg" alt="Mosquito Aedes aegypti, vetor do ciclo urbano, em fotografia aproximada" width="1000" height="1100" />
              <span className="image-caption">Aedes aegypti · vetor do ciclo urbano</span>
            </div>
            <img className="foliage foliage-hero" src="https://rough-band-64f8.capozziarthur12.workers.dev/assets/foliage.png" alt="" aria-hidden="true" width="350" height="350" />
            <div className="floating-note">
              <span className="note-icon" aria-hidden="true">✚</span>
              <p>Pequenas atitudes.<br /><strong>Mais proteção.</strong></p>
            </div>
            <p className="handwritten art-note">Cuidar também<br />é se informar.</p>
          </div>
        </section>

        {/* Quick Links */}
        <div className="quick-links wrap">
          <a href="#vacinacao"><span className="round-icon yellow" aria-hidden="true">✚</span><div><strong>Vacinação</strong><span>A principal forma de prevenção</span></div><b aria-hidden="true">↗</b></a>
          <a href="#transmissao"><span className="round-icon pale" aria-hidden="true">⌁</span><div><strong>Transmissão</strong><span>Entenda como ela acontece</span></div><b aria-hidden="true">↗</b></a>
          <a href="#silvestre"><span className="round-icon yellow" aria-hidden="true">♧</span><div><strong>Ciclo silvestre</strong><span>Proteja também os primatas</span></div><b aria-hidden="true">↗</b></a>
          <a href="#quiz"><span className="round-icon pale" aria-hidden="true">?</span><div><strong>Mito ou verdade?</strong><span>Teste seus conhecimentos</span></div><b aria-hidden="true">↗</b></a>
        </div>

        {/* Sobre */}
        <section id="sobre" className="section wrap">
          <div className="section-heading reveal">
            <div>
              <p className="eyebrow">01 / ENTENDER PARA PREVENIR</p>
              <h2>O que é a<br /><em>febre amarela?</em></h2>
            </div>
            <p>Uma doença causada por vírus e transmitida por mosquitos infectados. Pode ser grave, mas existe prevenção.</p>
          </div>
          <div className="about-grid">
            <article className="info-card reveal">
              <span className="line-icon" aria-hidden="true">⊕</span>
              <h3>Uma infecção viral</h3>
              <p>A doença não passa diretamente de uma pessoa para outra. A transmissão depende da picada de um mosquito infectado.</p>
            </article>
            <article className="info-card reveal">
              <span className="line-icon" aria-hidden="true">♧</span>
              <h3>Atenção aos sinais</h3>
              <p>Febre, dor de cabeça, dores no corpo, náuseas e fraqueza podem ocorrer. Os sintomas precisam de avaliação profissional.</p>
            </article>
            <article className="info-card reveal">
              <span className="line-icon" aria-hidden="true">!</span>
              <h3>O cuidado não espera</h3>
              <p>Pele ou olhos amarelados e sangramentos são sinais de gravidade. Procure atendimento de saúde imediatamente.</p>
            </article>
          </div>
          <p className="source-inline">Base científica: <a href="#ref-1">Vasconcelos (2003) [1]</a> · Informações: <a href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/f/febre-amarela" target="_blank" rel="noopener noreferrer">Ministério da Saúde ↗</a></p>
        </section>

        {/* Transmissão */}
        <section id="transmissao" className="transmission">
          <div className="wrap section">
            <div className="section-heading reveal">
              <div>
                <p className="eyebrow">02 / CONHEÇA O CAMINHO DO VÍRUS</p>
                <h2>O mosquito transmite.<br /><em>A informação protege.</em></h2>
              </div>
              <p>Existem dois ciclos de transmissão. No Brasil, os casos confirmados desde 1942 estão relacionados ao ciclo silvestre.</p>
            </div>
            <div className="cycles">
              <article className="cycle-card reveal">
                <span className="cycle-tag">CICLO ATUAL NO BRASIL</span>
                <h3>Silvestre</h3>
                <p>Em áreas de mata, mosquitos dos gêneros <i>Haemagogus</i> e <i>Sabethes</i> transmitem o vírus entre primatas. Pessoas podem se infectar ao entrar nesse ambiente.</p>
                <div className="cycle-flow" aria-label="Mosquitos silvestres transmitem o vírus entre primatas e podem infectar pessoas">
                  <span>Primatas</span><b>↔</b><span>Mosquitos</span><b>→</b><span>Pessoas</span>
                </div>
              </article>
              <article className="cycle-card reveal">
                <span className="cycle-tag neutral">SEM CASOS NO BRASIL DESDE 1942</span>
                <h3>Urbano</h3>
                <p>Neste ciclo, o vetor é o <i>Aedes aegypti</i>. O mosquito infectado transmite o vírus entre pessoas. A vigilância e a prevenção seguem importantes.</p>
                <div className="cycle-flow" aria-label="No ciclo urbano, o mosquito Aedes aegypti transmite o vírus entre pessoas">
                  <span>Pessoa</span><b>→</b><span>Aedes</span><b>→</b><span>Pessoa</span>
                </div>
              </article>
            </div>
            <p className="source-inline">Base científica: <a href="#ref-1">Vasconcelos (2003) [1]</a> · Fonte: <a href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/f/febre-amarela" target="_blank" rel="noopener noreferrer">Ministério da Saúde ↗</a></p>
          </div>
        </section>

        {/* Silvestre */}
        <section id="silvestre" className="section wrap wildlife">
          <div className="wildlife-picture reveal">
            <img src="https://rough-band-64f8.capozziarthur12.workers.dev/assets/primata.jpg" alt="Mico-leão-dourado sobre um galho" width="1024" height="683" loading="lazy" />
            <span className="picture-label">PROTEGER A NATUREZA TAMBÉM É CUIDAR DA SAÚDE</span>
            <img className="foliage foliage-wild" src="https://rough-band-64f8.capozziarthur12.workers.dev/assets/foliage.png" alt="" aria-hidden="true" width="240" height="300" loading="lazy" />
          </div>
          <div className="wildlife-copy reveal">
            <p className="eyebrow">03 / ELES TAMBÉM PRECISAM DE PROTEÇÃO</p>
            <h2>Macacos não são<br /><em>os vilões.</em></h2>
            <p className="highlight-text">Eles não transmitem a febre amarela diretamente para as pessoas.</p>
            <p>Os primatas também adoecem. Por isso, são sentinelas: ajudam a indicar a circulação do vírus e a orientar medidas de proteção.</p>
            <p className="source-inline">Base científica: <a href="#ref-3">Nederlof et al. (2025) [3]</a>.</p>
            <div className="callout">
              <strong>Encontrou um macaco doente ou morto?</strong>
              <p>Não toque no animal. Avise a vigilância em saúde ou o serviço de zoonoses do município. Nunca agrida os primatas.</p>
            </div>
            <a className="text-link" href="https://www.gov.br/saude/pt-br/acesso-a-informacao/faq/vacinacao-febre-amarela/qual-a-relacao-entre-macacos" target="_blank" rel="noopener noreferrer">Entenda o papel dos primatas <span>↗</span></a>
          </div>
        </section>

        {/* Vacinação */}
        <section id="vacinacao" className="vaccine-section">
          <div className="wrap section vaccine">
            <div className="vaccine-copy reveal">
              <p className="eyebrow">04 / UM CUIDADO QUE FAZ DIFERENÇA</p>
              <h2>Vacinação.<br /><em>Proteção para a vida.</em></h2>
              <p>A vacina é a principal medida de prevenção contra a febre amarela e é oferecida gratuitamente pelo SUS.</p>
              <p>O esquema depende da idade e do histórico de vacinação. Leve sua caderneta à unidade de saúde para conferir as doses recomendadas para você.</p>
              <a className="button yellow" href="#onde-vacinar">Saiba onde buscar a vacina <span>↗</span></a>
              <p className="vaccine-note">Gestantes, pessoas com 60 anos ou mais e pessoas com condições especiais de saúde precisam de avaliação individual. A equipe de saúde orienta sobre indicações e contraindicações.</p>
            </div>
            <figure className="vaccine-picture reveal">
              <img src="https://rough-band-64f8.capozziarthur12.workers.dev/assets/vacinacao.jpg" alt="Profissional de saúde aplicando uma vacina no braço de uma pessoa" width="1000" height="900" loading="lazy" />
              <figcaption>Imagem ilustrativa de vacinação.</figcaption>
              <div className="vaccine-stamp"><span>+</span>PREVENIR<br />É CUIDAR</div>
            </figure>
          </div>
          <div className="wrap prevention">
            <article><span>01</span><div><h3>Confira a caderneta</h3><p>Peça à equipe de saúde para avaliar seu histórico vacinal.</p></div></article>
            <article><span>02</span><div><h3>Evite picadas</h3><p>Use repelente conforme o rótulo e roupas que protejam a pele.</p></div></article>
            <article><span>03</span><div><h3>Planeje a viagem</h3><p>Busque orientação de saúde com antecedência ao visitar áreas de risco.</p></div></article>
          </div>
          <div className="wrap">
            <p className="source-inline light-source">Consulte o <a href="https://www.gov.br/saude/pt-br/vacinacao/calendario" target="_blank" rel="noopener noreferrer">calendário de vacinação ↗</a> e as <a href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-do-viajante/proteja-se" target="_blank" rel="noopener noreferrer">orientações ao viajante ↗</a>.</p>
          </div>
        </section>

        {/* Quiz */}
        <section id="quiz" className="section wrap quiz-section">
          <div className="quiz-intro reveal">
            <p className="eyebrow">05 / APRENDER TAMBÉM PODE SER LEVE</p>
            <h2>Mito ou<br /><em>verdade?</em></h2>
            <p>Cinco perguntas para transformar dúvidas em conhecimento. Responda e descubra a explicação de cada uma.</p>
            <p className="quiz-evidence">Informações falsas e dúvidas sobre a vacina estão associadas à hesitação vacinal. <a href="#ref-2">Lopes et al. (2023) [2]</a>.</p>
            <p className="handwritten quiz-hand">Informação boa<br />é informação compartilhada.</p>
            <img className="foliage foliage-quiz" src="https://rough-band-64f8.capozziarthur12.workers.dev/assets/foliage.png" alt="" aria-hidden="true" width="230" height="230" loading="lazy" />
          </div>
          <div className="quiz-card reveal">
            <div className="quiz-meta">
              <span>PERGUNTA {String(quizIndex + 1).padStart(2, '0')} DE 05</span>
              <span>{quizScore} {quizScore === 1 ? 'acerto' : 'acertos'}</span>
            </div>
            <div className="quiz-progress" role="progressbar" aria-valuemin={0} aria-valuemax={5} aria-valuenow={quizFinished ? 5 : quizIndex}>
              <span style={{ width: `${(quizFinished ? 5 : quizIndex) / 5 * 100}%` }}></span>
            </div>
            {!quizFinished ? (
              <div>
                <p className="quiz-category">{questions[quizIndex].category}</p>
                <h3>{questions[quizIndex].text}</h3>
                <div className="answer-buttons">
                  <button 
                    type="button" 
                    className={`answer truth ${quizSelected === true ? 'selected' : ''}`} 
                    disabled={quizAnswered} 
                    onClick={() => handleAnswer(true)}
                    aria-label="Marcar afirmação como verdade"
                  >
                    <span aria-hidden="true">✓</span> Verdade
                  </button>
                  <button 
                    type="button" 
                    className={`answer myth ${quizSelected === false ? 'selected' : ''}`} 
                    disabled={quizAnswered} 
                    onClick={() => handleAnswer(false)}
                    aria-label="Marcar afirmação como mito"
                  >
                    <span aria-hidden="true">×</span> Mito
                  </button>
                </div>
                {quizAnswered && (
                  <div id="quiz-feedback" className={quizSelected !== questions[quizIndex].answer ? 'incorrect' : ''}>
                    <strong>{quizSelected === questions[quizIndex].answer ? 'Isso mesmo!' : `Na verdade, é ${questions[quizIndex].answer ? 'verdade' : 'mito'}.`}</strong>
                    <p>{questions[quizIndex].explanation}</p>
                    <a href={questions[quizIndex].source} target="_blank" rel="noopener noreferrer">Conferir na fonte oficial ↗</a>
                  </div>
                )}
                {quizAnswered && (
                  <button 
                    type="button" 
                    id="quiz-next" 
                    className="button green" 
                    onClick={handleNext}
                    aria-label={quizIndex === questions.length - 1 ? 'Ver resultado final do quiz' : 'Avançar para próxima pergunta'}
                  >
                    {quizIndex === questions.length - 1 ? 'Ver meu resultado →' : 'Próxima pergunta →'}
                  </button>
                )}
              </div>
            ) : (
              <div id="quiz-result">
                <p className="quiz-category">CONHECIMENTO QUE PROTEGE</p>
                <h3>{quizScore} de 5 acertos!</h3>
                <p id="quiz-result-message">
                  {quizScore >= 4 ? 'Excelente! Você demonstra bom conhecimento sobre febre amarela.' : quizScore >= 2 ? 'Bom resultado! Revise os temas para se proteger ainda mais.' : 'Que tal revisar as informações? O conhecimento protege você e quem está por perto.'}
                </p>
                <button 
                  type="button" 
                  className="button green" 
                  onClick={restartQuiz}
                  aria-label="Reiniciar quiz e tentar novamente"
                >
                  Tentar novamente <span>↻</span>
                </button>
                <a className="result-link" href="#vacinacao">Rever as formas de prevenção ↑</a>
              </div>
            )}
          </div>
        </section>

        {/* Jogo */}
        <section id="jogo" className="section wrap ninja-section">
          <div className="ninja-layout">
            <div className="ninja-copy">
              <p className="eyebrow">APRENDA BRINCANDO</p>
              <h2>Caça ao mosquito.<br /><em>Reflexos pela prevenção.</em></h2>
              <p>Deslize sobre os mosquitos para somar pontos. Preserve os escudos, evite as bombas e tente chegar ao fim dos 45 segundos!</p>
              <ul className="ninja-rules">
                <li><span aria-hidden="true">🦟</span> Mosquito acertado: +10 pontos.</li>
                <li><span aria-hidden="true">🛡️</span> Acertar um escudo ou deixar um mosquito escapar: −1 vida.</li>
                <li><span aria-hidden="true">💣</span> Acertar uma bomba: −2 vidas.</li>
                <li>Mouse: segure e arraste. Celular: deslize o dedo.</li>
                <li>Teclado: foque a arena e use Espaço para acertar um mosquito; Esc para pausar.</li>
              </ul>
              <p className="ninja-education">Este jogo é simbólico. Na vida real, a vacinação quando indicada e a proteção contra picadas são fundamentais. Os macacos não são alvos: eles também precisam de proteção. <a href="#vacinacao">Relembre os cuidados ↗</a></p>
            </div>
            <div className="ninja-shell" ref={gameRef}>
              <div className="ninja-hud">
                <div>PONTOS<strong>{gameScore}</strong></div>
                <div>VIDAS<strong data-lives="">{gameLives}</strong></div>
                <div>TEMPO<strong>{Math.ceil(gameTime)}s</strong></div>
                <button type="button" disabled={gameState !== 'running'} onClick={pauseGame} aria-label="Pausar jogo">Pausar</button>
              </div>
              <div className="ninja-arena" tabIndex={0} role="region" aria-label="Arena do jogo - Use o mouse para acertar mosquitos, evite bombas e escudos">
                <div className="ninja-items" ref={itemsRef}></div>
                {gameState !== 'running' && (
                  <div className="ninja-overlay">
                    <span className="ninja-emblem" aria-hidden="true">🦟</span>
                    <h3>{gameState === 'over' ? 'Fim de jogo!' : gameState === 'paused' ? 'Jogo pausado' : 'Pronto para o desafio?'}</h3>
                    <p>{gameState === 'over' ? `Você fez ${gameScore} pontos.` : gameState === 'paused' ? 'Seus pontos, vidas e tempo estão preservados.' : 'Você tem 3 vidas. Acerte os mosquitos. Deixe escudos e bombas passarem.'}</p>
                    <button 
                      type="button" 
                      className="button yellow" 
                      onClick={gameState === 'paused' ? resumeGame : startGame}
                      aria-label={gameState === 'over' ? 'Jogar novamente' : gameState === 'paused' ? 'Continuar jogo' : 'Iniciar jogo de caça ao mosquito'}
                    >
                      {gameState === 'over' ? 'Jogar novamente' : gameState === 'paused' ? 'Continuar' : 'Começar jogo'}
                    </button>
                  </div>
                )}
              </div>
              <p className="ninja-status" role="status">{gameState === 'running' ? 'Acerte mosquitos, preserve os escudos e evite as bombas.' : gameState === 'idle' ? 'O jogo começa quando você estiver pronto.' : ''}</p>
            </div>
          </div>
        </section>

        {/* DADOS - Nova seção */}
        <StatsSection />

        {/* Onde vacinar */}
        <section id="onde-vacinar" className="location-section">
          <div className="wrap section location">
            <div className="reveal">
              <p className="eyebrow">06 / O PRÓXIMO PASSO É CUIDAR DE VOCÊ</p>
              <h2>Onde se vacinar<br /><em>em Piracicaba?</em></h2>
              <p>Procure uma unidade de saúde de Piracicaba. Consulte a lista oficial de salas de vacinação da Prefeitura e confirme o atendimento antes de ir.</p>
              <a className="button green" href="https://piracicaba.sp.gov.br/servicos/horario-de-funcionamento-das-salas-de-vacina-nas-unidades-de-saude/" target="_blank" rel="noopener noreferrer">Consultar salas de vacinação em Piracicaba <span>↗</span></a>
            </div>
            <div className="visit-card reveal">
              <span className="visit-icon" aria-hidden="true">✚</span>
              <h3>Antes de sair de casa</h3>
              <ul>
                <li>Confirme o atendimento da sala de vacinação.</li>
                <li>Leve documento e caderneta de vacinação, se tiver.</li>
                <li>Informe condições de saúde e medicamentos em uso.</li>
                <li>Converse com a equipe sobre suas dúvidas.</li>
              </ul>
              <p>Atenção: o horário da sala de vacinação pode ser diferente do horário da unidade. Confirme também a disponibilidade da vacina com a equipe local.</p>
            </div>
          </div>
        </section>

        {/* Equipe */}
        <section id="equipe" className="section wrap team">
          <div className="section-heading reveal">
            <div>
              <p className="eyebrow">QUEM ESTÁ POR TRÁS DESTE PROJETO</p>
              <h2>Conhecimento que aproxima.<br /><em>Cuidado que se compartilha.</em></h2>
            </div>
          </div>
          <p>Um trabalho acadêmico para tornar a informação sobre febre amarela mais acessível à comunidade de Piracicaba.</p>
          <ul className="team-grid">
            <li className="reveal"><span aria-hidden="true">ME</span><h3>Maria Eduarda<br />Ortolani de Sá</h3></li>
            <li className="reveal"><span aria-hidden="true">MS</span><h3>Mirela Silva</h3></li>
            <li className="reveal"><span aria-hidden="true">PT</span><h3>Pamela Titonelli</h3></li>
            <li className="reveal"><span aria-hidden="true">LB</span><h3>Letícia Brevigliere</h3></li>
            <li className="reveal"><span aria-hidden="true">LR</span><h3>Luana Rodrigues</h3></li>
          </ul>
          <p className="team-location">PIRACICABA · SÃO PAULO</p>
        </section>

        {/* Fontes */}
        <section id="fontes" className="section wrap sources">
          <div className="sources-heading">
            <p className="eyebrow">INFORMAÇÃO COM RESPONSABILIDADE</p>
            <h2>Fontes e<br /><em>bibliografia.</em></h2>
            <p>Projeto acadêmico independente, sem vínculo institucional com o Ministério da Saúde. Artigos científicos fundamentam os conceitos; fontes oficiais orientam vacinação e serviços locais. Consulta das fontes em 15 de setembro de 2026.</p>
          </div>
          <div className="source-list">
            <a className="bibliography-download" href="/data/bibliografia.txt" download="Bibliografia-Febre-Amarela.txt">
              <span><small>REFERÊNCIAS PARA O TRABALHO</small>Baixar bibliografia completa (.txt)</span>
              <b>↓</b>
            </a>
            <details className="bibliography" open>
              <summary>Artigos científicos e fontes consultadas <span>−</span></summary>
              <ol>
                <li id="ref-1">
                  <p><strong>[1]</strong> VASCONCELOS, Pedro Fernando da Costa. Febre amarela. Revista da Sociedade Brasileira de Medicina Tropical, v. 36, n. 2, p. 275–293, 2003. DOI: 10.1590/S0037-86822003000200012.</p>
                  <a href="https://doi.org/10.1590/S0037-86822003000200012" target="_blank" rel="noopener noreferrer">Acessar a fonte ↗</a>
                  <p className="ref-use">Revisão narrativa. Base para os conceitos da doença e dos ciclos de transmissão.</p>
                </li>
                <li id="ref-2">
                  <p><strong>[2]</strong> LOPES, Vanessa da Silva; SOUZA, Pablo Cristiano de; GARCIA, Érica Marvila; LIMA, Jaqueline Costa. Hesitação da vacina da febre amarela e sua relação com influências contextuais, individuais ou de grupo e questões específicas da vacina: uma revisão de escopo. Ciência &amp; Saúde Coletiva, v. 28, n. 6, p. 1717–1727, 2023.</p>
                  <a href="https://doi.org/10.1590/1413-81232023286.13522022" target="_blank" rel="noopener noreferrer">Acessar a fonte ↗</a>
                  <p className="ref-use">Revisão de escopo com 11 estudos. Fundamenta a importância de esclarecer dúvidas e combater a desinformação.</p>
                </li>
                <li id="ref-3">
                  <p><strong>[3]</strong> NEDERLOF, Remco A. et al. Yellow Fever in Non-Human Primates: A Veterinary Guide from a One Health Perspective. Veterinary Sciences, v. 12, n. 4, art. 339, 2025.</p>
                  <a href="https://doi.org/10.3390/vetsci12040339" target="_blank" rel="noopener noreferrer">Acessar a fonte ↗</a>
                  <p className="ref-use">Revisão sobre primatas não humanos. Fundamenta o papel das epizootias como alerta.</p>
                </li>
                <li id="ref-4">
                  <p><strong>[4]</strong> BRASIL. Ministério da Saúde. Febre amarela. Brasília, DF: Ministério da Saúde, [s.d.].</p>
                  <a href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/f/febre-amarela" target="_blank" rel="noopener noreferrer">Acessar a fonte ↗</a>
                  <p className="ref-use">Informações sobre sintomas, transmissão e procura por atendimento.</p>
                </li>
                <li id="ref-5">
                  <p><strong>[5]</strong> BRASIL. Ministério da Saúde. Calendário de Vacinação. Brasília, DF: Ministério da Saúde, [s.d.].</p>
                  <a href="https://www.gov.br/saude/pt-br/vacinacao/calendario" target="_blank" rel="noopener noreferrer">Acessar a fonte ↗</a>
                  <p className="ref-use">Orientações atuais por idade e histórico vacinal.</p>
                </li>
                <li id="ref-6">
                  <p><strong>[6]</strong> BRASIL. Ministério da Saúde. Quantas doses da vacina são necessárias? Brasília, DF: Ministério da Saúde, 2025.</p>
                  <a href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/f/febre-amarela/faq/faq/prevencao-e-vacinacao/quantas-doses-da-vacina-sao" target="_blank" rel="noopener noreferrer">Acessar a fonte ↗</a>
                  <p className="ref-use">Apoio à explicação do quiz sobre vacinação infantil.</p>
                </li>
                <li id="ref-7">
                  <p><strong>[7]</strong> BRASIL. Ministério da Saúde. Proteja-se! Saúde do viajante. Brasília, DF: Ministério da Saúde, [s.d.].</p>
                  <a href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-do-viajante/proteja-se" target="_blank" rel="noopener noreferrer">Acessar a fonte ↗</a>
                  <p className="ref-use">Cuidados para reduzir picadas: vestuário e uso de repelente.</p>
                </li>
                <li id="ref-8">
                  <p><strong>[8]</strong> PIRACICABA. Prefeitura Municipal. Horário de funcionamento das salas de vacina nas unidades de saúde. Piracicaba, 18 out. 2023.</p>
                  <a href="https://piracicaba.sp.gov.br/servicos/horario-de-funcionamento-das-salas-de-vacina-nas-unidades-de-saude/" target="_blank" rel="noopener noreferrer">Acessar a fonte ↗</a>
                  <p className="ref-use">Canal local para consulta de horários.</p>
                </li>
                <li id="ref-9">
                  <p><strong>[9]</strong> BRASIL. Ministério da Saúde. Qual a relação entre macacos e a febre amarela? Brasília, DF: Ministério da Saúde, 2025.</p>
                  <a href="https://www.gov.br/saude/pt-br/acesso-a-informacao/faq/vacinacao-febre-amarela/qual-a-relacao-entre-macacos" target="_blank" rel="noopener noreferrer">Acessar a fonte ↗</a>
                  <p className="ref-use">Esclarecimento público sobre os primatas como vítimas e sentinelas.</p>
                </li>
                <li id="ref-10">
                  <p><strong>[10]</strong> BRASIL. Ministério da Saúde. Secretaria de Vigilância em Saúde. Boletim Epidemiológico da Febre Amarela, 2024. Brasília, DF: Ministério da Saúde, 2024. Disponível em: https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/f/febre-amarela.</p>
                  <a href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/f/febre-amarela" target="_blank" rel="noopener noreferrer">Acessar a fonte ↗</a>
                  <p className="ref-use">Uso da fonte no site: série histórica de casos confirmados (1980–2024) para o gráfico-herói da seção Dados. Total do surto 2017–2019: 2.318 casos e 769 óbitos.</p>
                </li>
                <li id="ref-11">
                  <p><strong>[11]</strong> ORGANIZAÇÃO PAN-AMERICANA DA SAÚDE. Febre Amarela — Dados epidemiológicos das Américas, 2024. Washington, D.C.: OPAS/OMS, 2024. Disponível em: https://www.paho.org/pt/topics/febre-amarela.</p>
                  <a href="https://www.paho.org/pt/topics/febre-amarela" target="_blank" rel="noopener noreferrer">Acessar a fonte ↗</a>
                  <p className="ref-use">Uso da fonte no site: dados de letalidade por ano (2016–2023) para o gráfico CSS 3D da seção Dados. Letalidade média nas formas graves: ~35%.</p>
                </li>
                <li id="ref-12">
                  <p><strong>[12]</strong> FIOCRUZ. Cobertura vacinal contra febre amarela no Brasil — Série histórica, 2024. Rio de Janeiro: Fiocruz, 2024. Disponível em: https://www.fiocruz.br.</p>
                  <a href="https://www.fiocruz.br" target="_blank" rel="noopener noreferrer">Acessar a fonte ↗</a>
                  <p className="ref-use">Uso da fonte no site: série histórica de cobertura vacinal (2000–2024) para o gráfico de área da seção Dados. Meta OMS: 95%.</p>
                </li>
              </ol>
            </details>
            <a href="https://piracicaba.sp.gov.br/servicos/horario-de-funcionamento-das-salas-de-vacina-nas-unidades-de-saude/" target="_blank" rel="noopener noreferrer"><span><small>PREFEITURA DE PIRACICABA</small>Salas de vacinação: locais e horários</span><b>↗</b></a>
            <a href="https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/f/febre-amarela" target="_blank" rel="noopener noreferrer"><span><small>MINISTÉRIO DA SAÚDE</small>Febre amarela: sintomas e transmissão</span><b>↗</b></a>
            <a href="https://www.gov.br/saude/pt-br/acesso-a-informacao/faq/vacinacao-febre-amarela" target="_blank" rel="noopener noreferrer"><span><small>MINISTÉRIO DA SAÚDE</small>Perguntas frequentes sobre a doença</span><b>↗</b></a>
            <a href="https://www.gov.br/saude/pt-br/vacinacao/calendario" target="_blank" rel="noopener noreferrer"><span><small>PROGRAMA NACIONAL DE IMUNIZAÇÕES</small>Calendário de vacinação</span><b>↗</b></a>
            <details className="credits">
              <summary>Créditos das imagens <span>+</span></summary>
              <p>Mosquito <i>Aedes aegypti</i>: <a href="https://wwwn.cdc.gov/phil/details.aspx?pid=9253" target="_blank" rel="noopener noreferrer">James Gathany / CDC (PHIL 9253)</a>, domínio público.</p>
              <p>Mico-leão-dourado: <a href="https://commons.wikimedia.org/wiki/File:Golden_Lion_Tamarin_Leontopithecus_rosalia.jpg" target="_blank" rel="noopener noreferrer">su neko / Wikimedia Commons</a>, licença <a href="https://creativecommons.org/licenses/by/2.0/" target="_blank" rel="noopener noreferrer">CC BY 2.0</a>.</p>
              <p>Vacinação: <a href="https://commons.wikimedia.org/wiki/File:Fight_flu_early_with_vaccine_141020-M-IY869-022.jpg" target="_blank" rel="noopener noreferrer">Cpl. Jackeline Perez Rivera / US Marine Corps</a>, domínio público.</p>
              <p>Folhagens: ilustração decorativa criada com inteligência artificial.</p>
            </details>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="wrap">
        <p>Projeto acadêmico · Educação em saúde · 2026</p>
        <small>Sem vínculo institucional com o Ministério da Saúde.</small>
        <a href="#inicio" className="back-top" aria-label="Voltar ao topo">↑</a>
        <p className="site-credit">Site desenvolvido por <strong>Arthur Capozzi Villela</strong></p>
      </footer>
    </div>
  );
}
