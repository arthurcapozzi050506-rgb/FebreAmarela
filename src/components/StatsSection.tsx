import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import dados from '../data/dados.json';

const CasesChart3D = lazy(() => import('./CasesChart3D'));

export default function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [kpiAnimated, setKpiAnimated] = useState(false);
  const [counters, setCounters] = useState({ casos: 0, letalidade: 0, cobertura: 0, urbanos: 0 });
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
      letalidade: dados.kpis.letalidade_media,
      cobertura: dados.kpis.cobertura_vacinal_recente,
      urbanos: dados.kpis.casos_urbanos_desde_1942,
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
        letalidade: Math.round(targets.letalidade * eased * 10) / 10,
        cobertura: Math.round(targets.cobertura * eased * 10) / 10,
        urbanos: targets.urbanos,
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

      {/* KPIs */}
      <div className="kpi-grid reveal">
        <div className="kpi-card kpi-highlight">
          <div className="kpi-value">{counters.casos.toLocaleString('pt-BR')}</div>
          <div className="kpi-label">Casos confirmados no surto 2017–2019</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{counters.letalidade}<span className="kpi-suffix">%</span></div>
          <div className="kpi-label">Letalidade média nas formas graves</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{counters.cobertura}<span className="kpi-suffix">%</span></div>
          <div className="kpi-label">Cobertura vacinal mais recente (meta: 95%)</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{counters.urbanos}</div>
          <div className="kpi-label">Casos do ciclo urbano desde 1942</div>
        </div>
      </div>

      {/* Gráfico-herói 3D: Casos por ano */}
      <div className="chart-block reveal">
        <h3 className="chart-title">Casos confirmados de febre amarela no Brasil (2000–2024)</h3>
        <p className="chart-description">
          O gráfico mostra a evolução anual dos casos. O surto de 2017–2018 foi o maior já registrado, com mais de 2.000 casos em dois anos. O que este dado ensina: a vigilância constante e a vacinação são fundamentais para evitar novos surtos.
        </p>
        <Suspense fallback={<div className="chart-3d-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Carregando gráfico...</div>}>
          <CasesChart3D data={dados.casos_por_ano.serie} />
        </Suspense>
        <p className="source-inline">
          Fonte: <a href={dados.casos_por_ano.fonte_url} target="_blank" rel="noopener noreferrer">Ministério da Saúde — Boletins Epidemiológicos ↗</a> · Consulta: {dados.casos_por_ano.data_consulta}
        </p>
        <DataTable data={dados.casos_por_ano.serie} type="cases" />
      </div>

      {/* Gráfico CSS 3D: Óbitos e letalidade */}
      <div className="chart-block reveal">
        <h3 className="chart-title">Óbitos por febre amarela no Brasil</h3>
        <p className="chart-description">
          Os óbitos acompanham a tendência dos casos. A letalidade média nas formas graves varia de 30% a 60%, segundo a OPAS. O que este dado ensina: a febre amarela é uma doença grave — a prevenção pela vacina é essencial.
        </p>
        <DeathsChart data={dados.casos_por_ano.serie} visible={isVisible} />
        <p className="source-inline">
          Fonte: <a href="https://www.paho.org/pt/alertas-e-atualizacoes-epidemiologicas" target="_blank" rel="noopener noreferrer">OPAS/OMS — Atualização Epidemiológica Febre Amarela ↗</a> · Consulta: 2025-09-15
        </p>
        <DataTable data={dados.casos_por_ano.serie} type="deaths" />
      </div>

      {/* Gráfico CSS 3D: Cobertura vacinal */}
      <div className="chart-block reveal">
        <h3 className="chart-title">Cobertura vacinal contra febre amarela no Brasil</h3>
        <p className="chart-description">
          A linha tracejada indica a meta de 95% recomendada pela OPAS/OMS. A queda acentuada em 2017 coincide com o maior surto da doença. O que este dado ensina: cobertura vacinal abaixo da meta deixa a população vulnerável a surtos.
        </p>
        <VaccinationChart data={dados.cobertura_vacinal.serie} meta={dados.cobertura_vacinal.meta} visible={isVisible} />
        <p className="source-inline">
          Fonte: <a href={dados.cobertura_vacinal.fonte_url} target="_blank" rel="noopener noreferrer">Ministério da Saúde — Painel InfoMS ↗</a> · Consulta: {dados.cobertura_vacinal.data_consulta}
        </p>
        <DataTable data={dados.cobertura_vacinal.serie} type="vacc" />
      </div>
    </section>
  );
}

// Deaths Chart (CSS 3D)
function DeathsChart({ data, visible }: { data: { ano: number; obitos: number }[]; visible: boolean }) {
  const maxVal = Math.max(...data.map(d => d.obitos));
  
  return (
    <div className="css-3d-chart" role="img" aria-label="Gráfico de barras 3D mostrando óbitos por febre amarela no Brasil de 2000 a 2024. Pico em 2018 com 453 óbitos.">
      <div className="css-3d-inner">
        <div className="deaths-chart">
          {data.map((d, i) => {
            const height = (d.obitos / maxVal) * 100;
            const isSurto = d.ano >= 2017 && d.ano <= 2019;
            return (
              <div key={d.ano} className="deaths-bar-wrapper">
                <span className="deaths-bar-value">{d.obitos > 50 ? d.obitos : ''}</span>
                <div
                  className={`deaths-bar ${visible ? 'animated' : ''}`}
                  style={{
                    height: `${Math.max(height, 2)}%`,
                    background: isSurto ? 'linear-gradient(180deg, #c6a120, #8a6e14)' : 'linear-gradient(180deg, var(--green), #0a2a1f)',
                    transitionDelay: `${i * 40}ms`,
                    boxShadow: isSurto ? '0 4px 12px #c6a12040' : '0 4px 8px #143f3020',
                  }}
                />
                <span className="deaths-bar-label">{d.ano}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="chart-legend">
        <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: 'var(--green)' }}></div>Anos regulares</div>
        <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: '#c6a120' }}></div>Surto 2017–2019</div>
      </div>
    </div>
  );
}

// Vaccination Chart (SVG with CSS 3D perspective)
function VaccinationChart({ data, meta, visible }: { data: { ano: number; cobertura: number }[]; meta: number; visible: boolean }) {
  const maxVal = 100;
  const width = 100;
  const height = 100;
  const metaY = height - (meta / maxVal) * height;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.cobertura / maxVal) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <div className="css-3d-chart" role="img" aria-label={`Gráfico de área mostrando cobertura vacinal contra febre amarela de 2010 a 2024. Meta de 95% não foi atingida. Ponto mais baixo: 55,7% em 2017.`}>
      <div className="css-3d-inner">
        <div className="vacc-chart">
          <div className="vacc-area">
            <div className="vacc-meta-line" style={{ top: `${(1 - meta / maxVal) * 100}%` }}>
              <span className="vacc-meta-label">Meta: {meta}%</span>
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
        <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: '#c6a120', borderTop: '2px dashed #c6a120', height: 0 }}></div>Meta OPAS/OMS (95%)</div>
      </div>
    </div>
  );
}

// Accessible data table
function DataTable({ data, type }: { data: any[]; type: 'cases' | 'deaths' | 'vacc' }) {
  return (
    <div className="data-table-wrapper">
      <details>
        <summary>Ver dados em tabela (acessibilidade)</summary>
        <table>
          <thead>
            <tr>
              <th>Ano</th>
              {type === 'cases' && <th>Casos</th>}
              {type === 'deaths' && <th>Óbitos</th>}
              {type === 'vacc' && <th>Cobertura (%)</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((d: any) => (
              <tr key={d.ano}>
                <td>{d.ano}</td>
                <td>{type === 'cases' ? d.casos : type === 'deaths' ? d.obitos : d.cobertura}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
