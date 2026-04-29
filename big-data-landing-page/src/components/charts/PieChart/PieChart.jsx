/**
 * PieChart.jsx — Gráfico de torta (donut) con selector de año
 * Muestra la distribución porcentual de Motivo_Agrupado para el año seleccionado.
 * Incluye transiciones animadas al cambiar de año y leyenda con barras de progreso.
 */
import { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'
import './PieChart.css'

const CATEGORY_COLORS = {
  'SERVICIOS DEFICIENTES':    '#274c77',
  'COBROS Y FINANZAS':        '#6096ba',
  'POSTVENTA Y CALIDAD':      '#a3cef1',
  'LOGISTICA Y ENTREGA':      '#8b8c89',
  'INFORMACION Y CONTRATOS':  '#3a7ca5',
  'OTROS / VARIOS':           '#b8cfe8',
}

const SVG_SIZE = 300
const OUTER_RADIUS = 120
const INNER_RADIUS = 72  // donut hole

function formatNumber(n) {
  return d3.format(',')(n).replace(/,/g, '.')
}

export default function PieChart({ data }) {
  const svgRef       = useRef(null)
  const tooltipRef   = useRef(null)
  const arcRef       = useRef(null)   // guarda los ángulos actuales para interpolar
  const [selectedYear, setSelectedYear] = useState(null)
  const [hoveredCat, setHoveredCat]   = useState(null)

  // Años disponibles
  const years = useMemo(
    () => [...new Set(data.map(d => d.year))].sort(),
    [data]
  )

  // Inicializa el año seleccionado al más reciente
  useEffect(() => {
    if (years.length > 0 && selectedYear === null) {
      setSelectedYear(years[years.length - 1])
    }
  }, [years, selectedYear])

  // Slice de datos para el año seleccionado
  const slices = useMemo(() => {
    if (selectedYear === null) return []
    const filtered = data.filter(d => d.year === selectedYear)
    const total    = filtered.length
    const counts   = d3.rollup(filtered, v => v.length, d => d.groupedMotive)

    return Object.keys(CATEGORY_COLORS)
      .map(cat => ({
        category: cat,
        value:    counts.get(cat) ?? 0,
        pct:      total > 0 ? ((counts.get(cat) ?? 0) / total) * 100 : 0,
        color:    CATEGORY_COLORS[cat],
      }))
      .sort((a, b) => b.value - a.value)
  }, [data, selectedYear])

  const totalYear = useMemo(
    () => slices.reduce((s, d) => s + d.value, 0),
    [slices]
  )

  // Renderizado D3 con transición al cambiar año
  useEffect(() => {
    if (!svgRef.current || slices.length === 0) return

    const svg = d3.select(svgRef.current)
    const cx  = SVG_SIZE / 2
    const cy  = SVG_SIZE / 2

    // Generador de pie
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null)
      .padAngle(0.025)

    // Generador de arcos
    const arc = d3.arc()
      .innerRadius(INNER_RADIUS)
      .outerRadius(OUTER_RADIUS)
      .cornerRadius(4)

    // Arco expandido para hover
    const arcHover = d3.arc()
      .innerRadius(INNER_RADIUS)
      .outerRadius(OUTER_RADIUS + 10)
      .cornerRadius(4)

    const pieData = pie(slices)

    // Inicializar SVG si es la primera vez
    if (svg.select('g.pie-group').empty()) {
      svg.append('g')
        .attr('class', 'pie-group')
        .attr('transform', `translate(${cx},${cy})`)

      // Texto central (año)
      const center = svg.append('g')
        .attr('class', 'pie-center-label')
        .attr('transform', `translate(${cx},${cy})`)

      center.append('text')
        .attr('class', 'pie-center-label__value')
        .attr('y', -8)

      center.append('text')
        .attr('class', 'pie-center-label__sub')
        .attr('y', 16)
        .text('DENUNCIAS')
    }

    // Actualizar texto central
    svg.select('.pie-center-label__value')
      .text(formatNumber(totalYear))

    const g = svg.select('g.pie-group')

    // JOIN de arcos
    const groups = g.selectAll('.pie-arc')
      .data(pieData, d => d.data.category)

    // ENTER
    const enter = groups.enter()
      .append('g')
      .attr('class', 'pie-arc')

    enter.append('path')
      .each(function(d) { this._current = { startAngle: 0, endAngle: 0 } })
      .attr('fill', d => d.data.color)
      .on('mousemove', (event, d) => {
        const tip = tooltipRef.current
        if (!tip) return
        tip.querySelector('.pie-chart-tooltip__category').textContent = d.data.category
        tip.querySelector('.pie-chart-tooltip__value').textContent    = formatNumber(d.data.value)
        tip.querySelector('.pie-chart-tooltip__pct').textContent      = `${d.data.pct.toFixed(1)}% del total`
        tip.classList.add('is-visible')
        tip.style.left = `${event.clientX + 14}px`
        tip.style.top  = `${event.clientY - 60}px`
        setHoveredCat(d.data.category)

        d3.select(event.currentTarget)
          .transition().duration(150)
          .attr('d', arcHover)
      })
      .on('mouseleave', (event) => {
        if (tooltipRef.current) tooltipRef.current.classList.remove('is-visible')
        setHoveredCat(null)
        d3.select(event.currentTarget)
          .transition().duration(150)
          .attr('d', arc)
      })

    // UPDATE + ENTER — transición animada de ángulos
    const allGroups = enter.merge(groups)

    allGroups.classed('pie-arc--hovered', d => d.data.category === hoveredCat)

    allGroups.select('path')
      .transition()
      .duration(650)
      .ease(d3.easeCubicInOut)
      .attrTween('d', function(d) {
        const prev = this._current ?? { startAngle: 0, endAngle: 0 }
        const interp = d3.interpolate(prev, d)
        this._current = d
        return t => arc(interp(t))
      })
      .attr('fill', d => d.data.color)

    // EXIT
    groups.exit()
      .transition().duration(300)
      .style('opacity', 0)
      .remove()

  }, [slices, totalYear, hoveredCat])

  return (
    <section className="pie-chart-section" id="distribucion">
      <div className="container">
        {/* Encabezado */}
        <div className="pie-chart-section__header">
          <div className="pie-chart-section__tag">Gráfico 2 de 5</div>
          <h2 className="pie-chart-section__title">
            Distribución de Motivos por Año
          </h2>
          <p className="pie-chart-section__subtitle">
            Proporción de cada categoría de denuncia según el año seleccionado.
            Pasá el cursor sobre un sector para ver el detalle.
          </p>
        </div>

        <div className="pie-chart-layout">
          {/* Columna izquierda: selector + donut */}
          <div className="pie-chart-card">
            {/* Selector de año */}
            <div className="pie-year-selector" role="group" aria-label="Seleccionar año">
              {years.map(y => (
                <button
                  key={y}
                  className={`pie-year-btn ${selectedYear === y ? 'is-active' : ''}`}
                  onClick={() => setSelectedYear(y)}
                  aria-pressed={selectedYear === y}
                >
                  {y}
                </button>
              ))}
            </div>

            {/* Donut SVG */}
            <div className="pie-chart-svg-wrapper">
              <svg
                ref={svgRef}
                className={`pie-chart-svg ${hoveredCat ? 'has-hover' : ''}`}
                viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                aria-label={`Distribución de denuncias ${selectedYear}`}
                role="img"
              />
            </div>
          </div>

          {/* Columna derecha: leyenda con porcentajes */}
          <div className="pie-side-panel">
            <div className="pie-legend-card">
              <div className="pie-legend-card__title">
                Detalle — {selectedYear}
              </div>
              <ul className="pie-legend-list" role="list">
                {slices.map(s => (
                  <li
                    key={s.category}
                    className={`pie-legend-item ${hoveredCat && hoveredCat !== s.category ? 'is-dimmed' : ''}`}
                    onMouseEnter={() => setHoveredCat(s.category)}
                    onMouseLeave={() => setHoveredCat(null)}
                  >
                    <span
                      className="pie-legend-swatch"
                      style={{ background: s.color }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span className="pie-legend-name">{s.category}</span>
                        <span className="pie-legend-pct">{s.pct.toFixed(1)}%</span>
                      </div>
                      <div className="pie-legend-bar-track">
                        <div
                          className="pie-legend-bar-fill"
                          style={{ width: `${s.pct}%`, background: s.color }}
                        />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {formatNumber(s.value)} denuncias
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Tooltip */}
        <div ref={tooltipRef} className="pie-chart-tooltip" role="tooltip" aria-live="polite">
          <div className="pie-chart-tooltip__category" />
          <div className="pie-chart-tooltip__value" />
          <div className="pie-chart-tooltip__pct" />
        </div>
      </div>
    </section>
  )
}
