/**
 * RankingChart.jsx — Ranking de top 10 motivos específicos más denunciados
 * Gráfico de barras horizontales con filtro por año.
 * Usa el campo Motivo_Denuncia (motivo específico, no agrupado).
 */
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'
import './RankingChart.css'

const TOP_N    = 10
const BAR_COLORS = [
  '#274c77', '#2e5a8e', '#3568a6', '#3a7ca5',
  '#426e95', '#4d7fa8', '#6096ba', '#7aaec8',
  '#a3cef1', '#b8cfe8',
]

function formatNumber(n) {
  return d3.format(',')(n).replace(/,/g, '.')
}

/** Abrevia textos muy largos para la etiqueta de la barra */
function abbreviate(text, maxLen = 60) {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text
}

export default function RankingChart({ data }) {
  const tooltipRef     = useRef(null)
  const [selectedYear, setSelectedYear] = useState(null)
  const [mounted, setMounted]           = useState(false)

  // Trigger de animación de barras
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(timer)
  }, [])

  // Reset animación al cambiar año
  useEffect(() => {
    setMounted(false)
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [selectedYear])

  // Años disponibles
  const years = useMemo(
    () => [...new Set(data.map(d => d.year))].sort(),
    [data]
  )

  // Año inicial: más reciente
  useEffect(() => {
    if (years.length > 0 && selectedYear === null) {
      setSelectedYear(years[years.length - 1])
    }
  }, [years, selectedYear])

  // Datos del ranking filtrados y ordenados
  const { ranking, totalFiltered } = useMemo(() => {
    const filtered = selectedYear
      ? data.filter(d => d.year === selectedYear)
      : data

    const totalFiltered = filtered.length

    const counts = d3.rollup(filtered, v => v.length, d => d.motive)
    const ranking = [...counts.entries()]
      .map(([motive, count]) => ({ motive, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_N)

    return { ranking, totalFiltered }
  }, [data, selectedYear])

  const maxCount = ranking[0]?.count ?? 1

  const showTooltip = useCallback((event, item, pct) => {
    const tip = tooltipRef.current
    if (!tip) return
    tip.querySelector('.ranking-tooltip__motive').textContent = item.motive
    tip.querySelector('.ranking-tooltip__count').textContent  = formatNumber(item.count)
    tip.querySelector('.ranking-tooltip__pct').textContent    = `${pct.toFixed(2)}% del total filtrado`
    tip.classList.add('is-visible')
    tip.style.left = `${event.clientX + 16}px`
    tip.style.top  = `${event.clientY - 56}px`
  }, [])

  const hideTooltip = useCallback(() => {
    if (tooltipRef.current) tooltipRef.current.classList.remove('is-visible')
  }, [])

  return (
    <section className="ranking-section" id="ranking">
      <div className="container">
        {/* Encabezado */}
        <div className="ranking-section__header">
          <div className="ranking-section__tag">Gráfico 3 de 5</div>
          <h2 className="ranking-section__title">
            Top {TOP_N} — Motivos Más Denunciados
          </h2>
          <p className="ranking-section__subtitle">
            Los motivos específicos con mayor cantidad de denuncias registradas.
            Pasá el cursor sobre cada barra para ver el texto completo y la proporción.
          </p>
        </div>

        {/* Controles */}
        <div className="ranking-controls">
          <span className="ranking-controls__label">Filtrar por año:</span>
          <div className="ranking-year-selector" role="group" aria-label="Seleccionar año">
            {years.map(y => (
              <button
                key={y}
                className={`ranking-year-btn ${selectedYear === y ? 'is-active' : ''}`}
                onClick={() => setSelectedYear(y)}
                aria-pressed={selectedYear === y}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Card con el ranking */}
        <div className="ranking-card">
          <ul className="ranking-list" role="list" aria-label={`Top ${TOP_N} motivos ${selectedYear ?? 'todos los años'}`}>
            {ranking.map((item, i) => {
              const pct       = (item.count / totalFiltered) * 100
              const barWidth  = mounted ? (item.count / maxCount) * 100 : 0
              const color     = BAR_COLORS[i] ?? BAR_COLORS[BAR_COLORS.length - 1]
              const isTop3    = i < 3

              return (
                <li
                  key={item.motive}
                  className="ranking-row"
                  onMouseMove={e => showTooltip(e, item, pct)}
                  onMouseLeave={hideTooltip}
                  aria-label={`${i + 1}. ${item.motive}: ${formatNumber(item.count)} denuncias`}
                >
                  {/* Posición */}
                  <span className={`ranking-position ${isTop3 ? 'ranking-position--top3' : ''}`}>
                    {i + 1}
                  </span>

                  {/* Etiqueta + barra */}
                  <div className="ranking-bar-group">
                    <span className="ranking-label" title={item.motive}>
                      {abbreviate(item.motive)}
                    </span>
                    <div className="ranking-bar-track" role="presentation">
                      <div
                        className="ranking-bar-fill"
                        style={{ width: `${barWidth}%`, background: color }}
                      />
                    </div>
                  </div>

                  {/* Valor */}
                  <span className="ranking-value">{formatNumber(item.count)}</span>
                </li>
              )
            })}
          </ul>

          {/* Footer informativo */}
          <div className="ranking-card__footer">
            <span>
              Mostrando top {TOP_N} de{' '}
              <strong>{formatNumber(totalFiltered)}</strong> denuncias
              {selectedYear ? ` en ${selectedYear}` : ' (todos los años)'}
            </span>
            <span>
              Universo: motivos específicos únicos
            </span>
          </div>
        </div>

        {/* Tooltip */}
        <div ref={tooltipRef} className="ranking-tooltip" role="tooltip" aria-live="polite">
          <div className="ranking-tooltip__motive" />
          <div className="ranking-tooltip__count" />
          <div className="ranking-tooltip__pct" />
        </div>
      </div>
    </section>
  )
}
