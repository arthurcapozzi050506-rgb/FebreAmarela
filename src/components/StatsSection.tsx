import { useEffect, useRef, useState } from 'react';
import dados from '../data/dados.json';

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

      {/* Gráfico 1: Casos confirmados - Barras verticais SVG */}
      <div className="chart-block reveal">
        <h3 className="chart-title">🏔️ Casos confirmados de febre amarela no Brasil (1980–2024)</h3>
        <p className="chart-description">
          O gráfico mostra a evolução dos casos ao longo das décadas. O surto de 2017–2019 foi o maior já registrado, com mais de 2.000 casos em três anos. O que este dado ensina: a vigilância constante e a vacinação são fundamentais para evitar novos surtos.
        </p>
        <CasesChartSVG data={dados.casos_por_ano.serie} visible={isVisible} />
        <p className="source-inline">
          Fonte: <a href={dados.casos_por_ano.fonte_url} target="_blank" rel="noopener noreferrer">Ministério da Saúde / SVS — Boletim Epidemiológico da Febre Amarela, 2024 ↗</a> · Consulta: {dados.casos_por_ano.data_consulta}
        </p>
        <DataTable data={dados.casos_por_ano.serie} type="cases" />
      </div>

      {/* Gráfico 2: Letalidade - Barras horizontais SVG */}
      <div className="chart-block reveal">
        <h3 className="chart-title">📊 Letalidade por ano (%)</h3>
        <p className="chart-description">
          A febre amarela grave tem letalidade de aproximadamente 30–50% nos casos não vacinados. O que este dado ensina: a doença é grave e a vacinação é essencial para evitar óbitos.
        </p>
        <LetalityChartSVG data={dados.letalidade.serie} visible={isVisible} />
        <p className="source-inline">
          Fonte: <a href={dados.letalidade.fonte_url} target="_blank" rel="noopener noreferrer">OPAS/OMS — Febre Amarela: Dados epidemiológicos das Américas, 2024 ↗</a> · Consulta: {dados.letalidade.data_consulta}
        </p>
        <DataTable data={dados.letalidade.serie} type="letality" />
      </div>

      {/* Gráfico 3: Cobertura vacinal - Área/Linha SVG */}
      <div className="chart-block reveal">
        <h3 className="chart-title">📈 Cobertura vacinal contra febre amarela (%)</h3>
        <p className="chart-description">
          A meta da OMS é 95% de cobertura. No Brasil, a cobertura caiu nas últimas décadas, aumentando a vulnerabilidade. O que este dado ensina: cobertura vacinal abaixo da meta deixa a população vulnerável a surtos.
        </p>
        <VaccinationChartSVG data={dados.cobertura_vacinal.serie} meta={dados.cobertura_vacinal.meta} visible={isVisible} />
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

// === GRÁFICO 1: Casos confirmados - Barras verticais SVG ===
function CasesChartSVG({ data, visible }: { data: { ano: number; casos: number }[]; visible: boolean }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const maxCasos = Math.max(...data.map(d => d.casos));
  const svgWidth = 800;
  const svgHeight = 400;
  const padding = { top: 20, right: 20, bottom: 50, left: 60 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;
  const barWidth = chartWidth / data.length * 0.7;
  const barGap = chartWidth / data.length * 0.3;

  return (
    <div className="svg-chart-container" style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: '100%', height: 'auto', background: 'var(--paper)', borderRadius: '12px', border: '1px solid var(--line)' }}
        role="img"
        aria-label="Gráfico de barras mostrando casos confirmados de febre amarela no Brasil de 1980 a 2024. Pico em 2018 com 1376 casos."
      >
        <title>Casos confirmados de febre amarela no Brasil (1980–2024)</title>
        
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={padding.top + chartHeight * (1 - ratio)}
              x2={svgWidth - padding.right}
              y2={padding.top + chartHeight * (1 - ratio)}
              stroke="var(--line)"
              strokeWidth="1"
              strokeDasharray={i === 0 ? '0' : '4,4'}
            />
            <text
              x={padding.left - 10}
              y={padding.top + chartHeight * (1 - ratio) + 4}
              textAnchor="end"
              fontSize="11"
              fill="var(--muted)"
            >
              {Math.round(maxCasos * ratio)}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = (d.casos / maxCasos) * chartHeight;
          const x = padding.left + i * (barWidth + barGap) + barGap / 2;
          const y = padding.top + chartHeight - barHeight;
          const isSurto = d.ano >= 2017 && d.ano <= 2019;

          return (
            <g key={d.ano}>
              <rect
                x={x}
                y={visible ? y : padding.top + chartHeight}
                width={barWidth}
                height={visible ? barHeight : 0}
                fill={isSurto ? 'var(--yellow)' : 'var(--green)'}
                rx="2"
                style={{
                  transition: `all 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) ${i * 0.02}s`,
                }}
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGRectElement).getBoundingClientRect();
                  setTooltip({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10,
                    text: `${d.ano}: ${d.casos} casos${isSurto ? ' (Surto)' : ''}`,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                <title>{`${d.ano}: ${d.casos} casos${isSurto ? ' (Surto 2017-2019)' : ''}`}</title>
              </rect>
              
              {/* X-axis labels (a cada ~10 anos + surto) */}
              {(d.ano % 10 === 0 || isSurto) && (
                <text
                  x={x + barWidth / 2}
                  y={svgHeight - padding.bottom + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--muted)"
                >
                  {d.ano}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            background: 'var(--green)',
            color: 'var(--paper)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: '600',
            pointerEvents: 'none',
            zIndex: 100,
            whiteSpace: 'nowrap',
          }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Legenda */}
      <div className="chart-legend" style={{ marginTop: '12px' }}>
        <div className="chart-legend-item">
          <div className="chart-legend-dot" style={{ background: 'var(--green)' }}></div>
          Anos regulares
        </div>
        <div className="chart-legend-item">
          <div className="chart-legend-dot" style={{ background: 'var(--yellow)' }}></div>
          Surto 2017–2019
        </div>
      </div>
    </div>
  );
}

// === GRÁFICO 2: Letalidade - Barras horizontais SVG ===
function LetalityChartSVG({ data, visible }: { data: { ano: number; letalidade: number }[]; visible: boolean }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const maxVal = 50;
  const avgLetality = 35;
  const svgWidth = 800;
  const svgHeight = 350;
  const padding = { top: 20, right: 80, bottom: 30, left: 60 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;
  const barHeight = chartHeight / data.length * 0.7;
  const barGap = chartHeight / data.length * 0.3;

  return (
    <div className="svg-chart-container" style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: '100%', height: 'auto', background: 'var(--paper)', borderRadius: '12px', border: '1px solid var(--line)' }}
        role="img"
        aria-label="Gráfico de barras horizontais mostrando letalidade de febre amarela no Brasil de 2016 a 2023. Média de 35%."
      >
        <title>Letalidade por ano (2016–2023)</title>

        {/* Linha de referência da média */}
        <line
          x1={padding.left + (avgLetality / maxVal) * chartWidth}
          y1={padding.top}
          x2={padding.left + (avgLetality / maxVal) * chartWidth}
          y2={svgHeight - padding.bottom}
          stroke="var(--yellow)"
          strokeWidth="2"
          strokeDasharray="6,4"
        />
        <text
          x={padding.left + (avgLetality / maxVal) * chartWidth + 5}
          y={padding.top + 15}
          fontSize="11"
          fill="#b39020"
          fontWeight="600"
        >
          Média: {avgLetality}%
        </text>

        {/* Bars */}
        {data.map((d, i) => {
          const barWidth = (d.letalidade / maxVal) * chartWidth;
          const y = padding.top + i * (barHeight + barGap) + barGap / 2;

          return (
            <g key={d.ano}>
              {/* Y-axis label */}
              <text
                x={padding.left - 10}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                fontSize="12"
                fill="var(--muted)"
                fontWeight="500"
              >
                {d.ano}
              </text>

              {/* Bar */}
              <rect
                x={padding.left}
                y={y}
                width={visible ? barWidth : 0}
                height={barHeight}
                fill="var(--green)"
                rx="4"
                style={{
                  transition: `width 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) ${i * 0.08}s`,
                }}
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGRectElement).getBoundingClientRect();
                  setTooltip({
                    x: rect.right + 10,
                    y: rect.top + rect.height / 2,
                    text: `${d.letalidade}%`,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                <title>{`${d.ano}: ${d.letalidade}%`}</title>
              </rect>

              {/* Value label */}
              <text
                x={padding.left + (visible ? barWidth : 0) + 8}
                y={y + barHeight / 2 + 4}
                fontSize="12"
                fill="var(--green)"
                fontWeight="600"
                style={{
                  transition: `x 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) ${i * 0.08}s`,
                }}
              >
                {d.letalidade}%
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateY(-50%)',
            background: 'var(--green)',
            color: 'var(--paper)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: '600',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Legenda */}
      <div className="chart-legend" style={{ marginTop: '12px' }}>
        <div className="chart-legend-item">
          <div className="chart-legend-dot" style={{ background: 'var(--green)' }}></div>
          Letalidade (%)
        </div>
        <div className="chart-legend-item">
          <div className="chart-legend-dot" style={{ background: 'var(--yellow)', width: '20px', height: '2px' }}></div>
          Média (~35%)
        </div>
      </div>
    </div>
  );
}

// === GRÁFICO 3: Cobertura vacinal - Área/Linha SVG ===
function VaccinationChartSVG({ data, meta, visible }: { data: { ano: number; cobertura: number }[]; meta: number; visible: boolean }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const maxVal = 100;
  const svgWidth = 800;
  const svgHeight = 400;
  const padding = { top: 20, right: 20, bottom: 50, left: 60 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (d.cobertura / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  return (
    <div className="svg-chart-container" style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: '100%', height: 'auto', background: 'var(--paper)', borderRadius: '12px', border: '1px solid var(--line)' }}
        role="img"
        aria-label="Gráfico de área mostrando cobertura vacinal contra febre amarela de 2000 a 2024. Meta de 95% não foi atingida."
      >
        <title>Cobertura vacinal contra febre amarela (2000–2024)</title>

        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--pale)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--pale)" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = padding.top + chartHeight - (val / maxVal) * chartHeight;
          return (
            <g key={val}>
              <line
                x1={padding.left}
                y1={y}
                x2={svgWidth - padding.right}
                y2={y}
                stroke="var(--line)"
                strokeWidth="1"
                strokeDasharray={val === 0 ? '0' : '4,4'}
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--muted)"
              >
                {val}%
              </text>
            </g>
          );
        })}

        {/* Linha de meta OMS */}
        <line
          x1={padding.left}
          y1={padding.top + chartHeight - (meta / maxVal) * chartHeight}
          x2={svgWidth - padding.right}
          y2={padding.top + chartHeight - (meta / maxVal) * chartHeight}
          stroke="var(--yellow)"
          strokeWidth="2"
          strokeDasharray="8,4"
        />
        <text
          x={svgWidth - padding.right - 5}
          y={padding.top + chartHeight - (meta / maxVal) * chartHeight - 8}
          textAnchor="end"
          fontSize="12"
          fill="#b39020"
          fontWeight="700"
        >
          Meta OMS: {meta}%
        </text>

        {/* Área preenchida */}
        {visible && (
          <path
            d={areaPath}
            fill="url(#areaGradient)"
            style={{
              opacity: 0,
              animation: 'fadeIn 0.8s ease forwards',
            }}
          />
        )}

        {/* Linha */}
        {visible && (
          <path
            d={linePath}
            fill="none"
            stroke="var(--green)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 2000,
              strokeDashoffset: 2000,
              animation: 'drawLine 1.5s ease forwards',
            }}
          />
        )}

        {/* Pontos */}
        {points.map((p, i) => (
          <g key={p.ano}>
            <circle
              cx={p.x}
              cy={p.y}
              r="5"
              fill="var(--green)"
              stroke="var(--paper)"
              strokeWidth="2"
              style={{
                opacity: visible ? 1 : 0,
                transition: `opacity 0.3s ease ${i * 0.05}s`,
              }}
              onMouseEnter={(e) => {
                const rect = (e.target as SVGCircleElement).getBoundingClientRect();
                setTooltip({
                  x: rect.left + rect.width / 2,
                  y: rect.top - 10,
                  text: `${p.ano}: ${p.cobertura}%`,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <title>{`${p.ano}: ${p.cobertura}%`}</title>
            </circle>

            {/* Rótulos em pontos-chave */}
            {(p.ano === 2000 || p.ano === 2010 || p.ano === 2024) && (
              <text
                x={p.x}
                y={p.y - 12}
                textAnchor="middle"
                fontSize="11"
                fill="var(--green)"
                fontWeight="600"
                style={{
                  opacity: visible ? 1 : 0,
                  transition: `opacity 0.3s ease ${i * 0.05 + 0.3}s`,
                }}
              >
                {p.cobertura}%
              </text>
            )}

            {/* X-axis labels */}
            {(p.ano % 4 === 0 || p.ano === 2024) && (
              <text
                x={p.x}
                y={svgHeight - padding.bottom + 20}
                textAnchor="middle"
                fontSize="10"
                fill="var(--muted)"
              >
                {p.ano}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            background: 'var(--green)',
            color: 'var(--paper)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: '600',
            pointerEvents: 'none',
            zIndex: 100,
            whiteSpace: 'nowrap',
          }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Legenda */}
      <div className="chart-legend" style={{ marginTop: '12px' }}>
        <div className="chart-legend-item">
          <div className="chart-legend-dot" style={{ background: 'var(--green)' }}></div>
          Cobertura vacinal (%)
        </div>
        <div className="chart-legend-item">
          <div className="chart-legend-dot" style={{ background: 'var(--yellow)', width: '20px', height: '2px' }}></div>
          Meta OMS ({meta}%)
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        @keyframes drawLine {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

// === Tabela de dados acessível ===
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
