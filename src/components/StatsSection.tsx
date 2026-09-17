import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import dados from '../data/dados.json';

const CasesChart3D = lazy(() => import('./CasesChart3D'));

export default function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [kpiAnimated, setKpiAnimated] = useState(false);
  const [counters, setCounters] = useState({
    casos: 0,
    obitos: 0,
    ultimo: 0,
    meta: 0,
  });
  const reducedMotion = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  // IntersectionObserver to trigger animations
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Animate KPI counters
  useEffect(() => {
    if (!isVisible || kpiAnimated) return;
    setKpiAnimated(true);

    const targets = {
      casos: dados.kpis.casos_surto_2017_2019,
      obitos: dados.kpis.obitos_surto_2017_2019,
      ultimo: dados.kpis.ultimo_caso_urbano,
      meta: dados.kpis.meta_cobertura,
    };

    if (reducedMotion) {
      setCounters(targets);
      return;
    }

    const duration = 1800;
    const start = performance.now();
    let raf: number;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCounters({
        casos: Math.round(targets.casos * eased),
        obitos: Math.round(targets.obitos * eased),
        ultimo: targets.ultimo,
        meta: Math.round(targets.meta * eased),
      });

      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isVisible, kpiAnimated, reducedMotion]);

  return (
    <section id="dados" className="section wrap stats-section" ref={sectionRef}>
      <div className="stats-intro reveal">
        <p className="eyebrow">NÚMEROS QUE INFORMAM</p>
        <h2>Dados em<br /><em>perspectiva.</em></h2>
        <p>Números reais para entender a dimensão da febre amarela no Brasil. Cada dado conta uma história de prevenção e cuidado.</p>
      </div>

      {/* Faixa de estatísticas - 4 mini-cards */}
      <div className="stats-strip reveal">
        <div className="stat-mini-card">
          <div className="stat-mini-value">Desde 1942</div>
          <div className="stat-mini-label">Sem ciclo urbano no Brasil</div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-mini-value">~35%</div>
          <div className="stat-mini-label">Letalidade média (forma grave)</div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-mini-value">95%</div>
          <div className="stat-mini-label">Meta de cobertura vacinal (OMS)</div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-mini-value">1 dose</div>
          <div className="stat-mini-label">Proteção para toda a vida</div>
        </div>
      </div>

      {/* Gráfico-herói 3D: Casos por ano */}
      <div className="chart-block reveal">
        <h3 className="chart-title">🏔️ Casos confirmados de febre amarela no Brasil (1980–2024)</h3>
        <p className="chart-description">
          O gráfico mostra a evolução dos casos ao longo das décadas. O surto de 2017–2019 foi o maior já registrado, com mais de 2.000 casos em três anos. O que este dado ensina: a vigilância constante e a vacinação são fundamentais para evitar novos surtos.
        </p>
        <Suspense fallback={<div className="chart-3d-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Carregando gráfico...</div>}>
          <CasesChart3D data={dados.casos_por_ano.serie.map(d => ({ ano: d.ano, casos: d.casos }))} />
        </Suspense>
        <p className="source-inline">
          Fonte: <a href={dados.casos_por_ano.fonte_url} target="_blank" rel="noopener noreferrer">Ministério da Saúde / SVS — Boletim Epidemiológico da Febre Amarela, 2024 ↗</a> · Consulta: {dados.casos_por_ano.data_consulta}
        </p>
        <DataTable data={dados.casos_por_ano.serie} type="cases" />
      </div>

      {/* Gráfico CSS 3D: Letalidade */}
      <div className="chart-block reveal">
        <h3 className="chart-title">📊 Letalidade por ano (%)</h3>
        <p className="chart-description">
          A febre amarela grave tem letalidade de aproximadamente 30–50% nos casos não vacinados. O que este dado ensina: a doença é grave e a vacinação é essencial para evitar óbitos.
        </p>
        <LetalityChart data={dados.letalidade.serie} visible={isVisible} />
        <p className="source-inline">
          Fonte: <a href={dados.letalidade.fonte_url} target="_blank" rel="noopener noreferrer">OPAS/OMS — Febre Amarela: Dados epidemiológicos das Américas, 2024 ↗</a> · Consulta: {dados.letalidade.data_consulta}
        </p>
        <DataTable data={dados.letalidade.serie} type="letality" />
      </div>

      {/* Gráfico CSS 3D: Cobertura vacinal */}
      <div className="chart-block reveal">
        <h3 className="chart-title">📈 Cobertura vacinal contra febre amarela (%)</h3>
        <p className="chart-description">
          A meta da OMS é 95% de cobertura. No Brasil, a cobertura caiu nas últimas décadas, aumentando a vulnerabilidade. O que este dado ensina: cobertura vacinal abaixo da meta deixa a população vulnerável a surtos.
        </p>
        <VaccinationChart data={dados.cobertura_vacinal.serie} meta={dados.cobertura_vacinal.meta} visible={isVisible} />
        <p className="source-inline">
          Fonte: <a href={dados.cobertura_vacinal.fonte_url} target="_blank" rel="noopener noreferrer">Fiocruz — Cobertura vacinal contra febre amarela no Brasil: Série histórica, 2024 ↗</a> · Consulta: {dados.cobertura_vacinal.data_consulta}
        </p>
        <DataTable data={dados.cobertura_vacinal.serie} type="vacc" />
      </div>

      {/* 4 Contadores animados */}
      <div className="kpi-grid reveal">
        <div className="kpi-card kpi-highlight">
          <div className="kpi-value">{counters.casos.toLocaleString('pt-BR')}</div>
          <div className="kpi-label">Casos no surto 2017–2019</div>
        </div>
        <div className="kpi-card kpi-highlight">
          <div className="kpi-value">{counters.obitos.toLocaleString('pt-BR')}</div>
          <div className="kpi-label">Óbitos no surto 2017–2019</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{counters.ultimo}</div>
          <div className="kpi-label">Último caso urbano no Brasil</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{counters.meta}<span className="kpi-suffix">%</span></div>
          <div className="kpi-label">Meta de cobertura vacinal (OMS)</div>
        </div>
      </div>
    </section>
  );
}

// Letality Chart (CSS 3D)
function LetalityChart({ data, visible }: { data: { ano: number; letalidade: number }[]; visible: boolean }) {
  const maxVal = 50;
  
  return (
    <div className="css-3d-chart" role="img" aria-label="Gráfico de barras 3D mostrando letalidade de febre amarela no Brasil de 2016 a 2023. Valores variam entre 28,6% e 41,5%.">
      <div className="css-3d-inner">
        <div className="deaths-chart">
          {data.map((d, i) => {
            const height = (d.letalidade / maxVal) * 100;
            return (
              <div key={d.ano} className="deaths-bar-wrapper">
                <span className="deaths-bar-value">{d.letalidade}%</span>
                <div
                  className={`deaths-bar ${visible ? 'animated' : ''}`}
                  style={{
                    height: `${Math.max(height, 2)}%`,
                    background: 'linear-gradient(180deg, var(--green), #0a2a1f)',
                    transitionDelay: `${i * 60}ms`,
                    boxShadow: '0 4px 8px #143f3020',
                  }}
                />
                <span className="deaths-bar-label">{d.ano}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="chart-legend">
        <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: 'var(--green)' }}></div>Letalidade (%)</div>
      </div>
    </div>
  );
}

// Vaccination Chart (SVG with CSS 3D perspective)
function VaccinationChart({ data, meta, visible }: { data: { ano: number; cobertura: number }[]; meta: number; visible: boolean }) {
  const maxVal = 100;
  const width = 100;
  const height = 100;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.cobertura / maxVal) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <div className="css-3d-chart" role="img" aria-label={`Gráfico de área mostrando cobertura vacinal contra febre amarela de 2000 a 2024. Meta de 95% não foi atingida. Cobertura caiu de 72% em 2000 para 67% em 2024.`}>
      <div className="css-3d-inner">
        <div className="vacc-chart">
          <div className="vacc-area">
            <div className="vacc-meta-line" style={{ top: `${(1 - meta / maxVal) * 100}%` }}>
              <span className="vacc-meta-label">Meta OMS: {meta}%</span>
            </div>
            <svg className="vacc-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="vaccGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--yellow)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--yellow)" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              {visible && (
                <>
                  <polygon points={areaPoints} fill="url(#vaccGrad)" className="vacc-area-fill" />
                  <polyline points={points} fill="none" stroke="var(--yellow)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                  {data.map((d, i) => {
                    const x = (i / (data.length - 1)) * width;
                    const y = height - (d.cobertura / maxVal) * height;
                    return <circle key={d.ano} cx={x} cy={y} r="0.8" fill="var(--green)" stroke="var(--yellow)" strokeWidth="0.3" />;
                  })}
                </>
              )}
            </svg>
            {/* X-axis labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '.65rem', color: 'var(--muted)' }}>
              <span>{data[0]?.ano}</span>
              <span>{data[Math.floor(data.length / 2)]?.ano}</span>
              <span>{data[data.length - 1]?.ano}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="chart-legend">
        <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: 'var(--yellow)' }}></div>Cobertura vacinal (%)</div>
        <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: '#c6a120', borderTop: '2px dashed #c6a120', height: 0 }}></div>Meta OMS (95%)</div>
      </div>
    </div>
  );
}

// Accessible data table
function DataTable({ data, type }: { data: any[]; type: 'cases' | 'letality' | 'vacc' }) {
  return (
    <div className="data-table-wrapper">
      <details>
        <summary>Ver dados em tabela (acessibilidade)</summary>
        <table>
          <thead>
            <tr>
              <th>Ano</th>
              {type === 'cases' && <th>Casos</th>}
              {type === 'letality' && <th>Letalidade (%)</th>}
              {type === 'vacc' && <th>Cobertura (%)</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((d: any) => (
              <tr key={d.ano}>
                <td>{d.ano}</td>
                <td>{type === 'cases' ? d.casos : type === 'letality' ? d.letalidade : d.cobertura}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
