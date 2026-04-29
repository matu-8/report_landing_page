/**
 * LineChart.jsx — Tendencia de Motivos de Denuncia (2019-2022)
 * Gráfico de líneas multi-serie con área rellena, puntos interactivos y leyenda.
 * Replica la visualización de tendencia.jpeg con D3.js y la paleta del proyecto.
 */
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'
import './LineChart.css'

const CATEGORY_COLORS = {
  'SERVICIOS DEFICIENTES':    '#274c77',
  'COBROS Y FINANZAS':        '#6096ba',
  'POSTVENTA Y CALIDAD':      '#a3cef1',
  'LOGISTICA Y ENTREGA':      '#8b8c89',
  'INFORMACION Y CONTRATOS':  '#3a7ca5',
  'OTROS / VARIOS':           '#b8cfe8',
}

const MARGIN = { top: 24, right: 24, bottom: 48, left: 64 }
const DOT_RADIUS = 5

function formatNumber(n) {
  return d3.format(',')(n).replace(/,/g, '.')
}

export default function LineChart({ data }) {
  const svgRef       = useRef(null)
  const wrapperRef   = useRef(null)
  const tooltipRef   = useRef(null)
  const [hoveredCat, setHoveredCat]   = useState(null)
  const [hiddenCats, setHiddenCats]   = useState(new Set())
  const [width, setWidth]             = useState(0)

  const categories = Object.keys(CATEGORY_COLORS)

  // Agrega: conteo por año × categoría
  const seriesData = useMemo(() => {
    const years = [...new Set(data.map(d => d.year))].sort()
    const counts = d3.rollup(data, v => v.length, d => d.groupedMotive, d => d.year)

    return {
      years,
      series: categories.map(cat => ({
        category: cat,
        color:    CATEGORY_COLORS[cat],
        points:   years.map(y => ({ year: y, value: counts.get(cat)?.get(y) ?? 0 })),
      })),
    }
  }, [data])

  const toggleCat = useCallback((cat) => {
    setHiddenCats(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  const visibleSeries = useMemo(
    () => seriesData.series.filter(s => !hiddenCats.has(s.category)),
    [seriesData, hiddenCats]
  )

  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current || width === 0) return

    const { years } = seriesData
    const totalWidth = width
    const totalHeight = Math.max(320, Math.min(420, totalWidth * 0.45))
    const innerW     = totalWidth - MARGIN.left - MARGIN.right
    const innerH     = totalHeight - MARGIN.top - MARGIN.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg
      .attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`)
      .attr('class', `line-chart-svg ${hoveredCat ? 'has-hover' : ''}`)

    const g = svg.append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    // Escalas
    const xScale = d3.scalePoint()
      .domain(years.map(String))
      .range([0, innerW])
      .padding(0.2)

    const maxVal = d3.max(visibleSeries, s => d3.max(s.points, p => p.value)) ?? 0

    const yScale = d3.scaleLinear()
      .domain([0, maxVal * 1.1])
      .nice()
      .range([innerH, 0])

    // Grid horizontal
    g.append('g')
      .call(d3.axisLeft(yScale).tickSize(-innerW).tickFormat('').ticks(5))
      .call(sel => {
        sel.select('.domain').remove()
        sel.selectAll('line').attr('class', 'line-grid-line')
      })

    // Eje X
    g.append('g')
      .attr('class', 'line-axis')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).tickSizeOuter(0))
      .call(sel => {
        sel.select('.domain').attr('stroke', 'var(--color-border)')
        sel.selectAll('text').attr('dy', '1.4em')
      })

    // Eje Y
    g.append('g')
      .attr('class', 'line-axis')
      .call(
        d3.axisLeft(yScale)
          .ticks(5)
          .tickFormat(d => d >= 1000 ? `${d / 1000}k` : d)
      )
      .call(sel => sel.select('.domain').attr('stroke', 'var(--color-border)'))

    // Etiqueta eje Y
    g.append('text')
      .attr('class', 'line-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .text('Número de Denuncias')

    // Generadores de línea y área
    const lineGen = d3.line()
      .x(d => xScale(String(d.year)))
      .y(d => yScale(d.value))
      .curve(d3.curveCatmullRom.alpha(0.5))

    const areaGen = d3.area()
      .x(d => xScale(String(d.year)))
      .y0(innerH)
      .y1(d => yScale(d.value))
      .curve(d3.curveCatmullRom.alpha(0.5))

    // Render por serie
    visibleSeries.forEach(serie => {
      const isHovered = hoveredCat === serie.category
      // Sanitiza el nombre para uso como clase CSS (elimina cualquier caracter no alfanumérico)
      const safeClass = serie.category.replace(/[^a-zA-Z0-9]/g, '-')

      // Área
      g.append('path')
        .datum(serie.points)
        .attr('class', `line-area ${isHovered ? 'line-area--hovered' : ''}`)
        .attr('fill', serie.color)
        .attr('d', areaGen)

      // Línea — animación de dibujo
      const path = g.append('path')
        .datum(serie.points)
        .attr('class', `line-path ${isHovered ? 'line-path--hovered' : ''}`)
        .attr('stroke', serie.color)
        .attr('d', lineGen)

      const totalLen = path.node().getTotalLength()
      path
        .attr('stroke-dasharray', `${totalLen} ${totalLen}`)
        .attr('stroke-dashoffset', totalLen)
        .transition()
        .duration(900)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0)

      // Puntos
      g.selectAll(`.dot-${safeClass}`)
        .data(serie.points)
        .join('circle')
        .attr('class', `line-dot ${isHovered ? 'line-dot--hovered' : ''}`)
        .attr('cx', d => xScale(String(d.year)))
        .attr('cy', d => yScale(d.value))
        .attr('r', 0)
        .attr('fill', serie.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .on('mousemove', (event, d) => {
          const tip = tooltipRef.current
          if (!tip) return
          tip.querySelector('.line-chart-tooltip__category').textContent = serie.category
          tip.querySelector('.line-chart-tooltip__value').textContent    = formatNumber(d.value)
          tip.querySelector('.line-chart-tooltip__year').textContent     = `Año ${d.year}`
          tip.classList.add('is-visible')
          tip.style.left = `${event.clientX + 14}px`
          tip.style.top  = `${event.clientY - 64}px`
          setHoveredCat(serie.category)
        })
        .on('mouseleave', () => {
          if (tooltipRef.current) tooltipRef.current.classList.remove('is-visible')
          setHoveredCat(null)
        })
        .transition()
        .duration(400)
        .delay(800)
        .attr('r', DOT_RADIUS)
    })

  }, [seriesData, visibleSeries, hoveredCat, width])

  // ResizeObserver — actualiza el estado `width` para triggear el re-render del gráfico
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width ?? 0
      if (w > 0) setWidth(w)
    })
    ro.observe(wrapper)
    return () => ro.disconnect()
  }, [])

  return (
    <section className="line-chart-section" id="tendencia">
      <div className="container">
        <div className="line-chart-section__header">
          <div className="line-chart-section__tag">Gráfico 5 de 5</div>
          <h2 className="line-chart-section__title">
            Tendencia de Motivos de Denuncia (2019–2022)
          </h2>
          <p className="line-chart-section__subtitle">
            Evolución temporal del número de denuncias por categoría agrupada.
            Hacé clic en la leyenda para mostrar u ocultar categorías.
          </p>
        </div>

        <div className="line-chart-card" ref={wrapperRef}>
          <svg ref={svgRef} className="line-chart-svg" />

          {/* Leyenda */}
          <div className="line-chart-legend" role="list" aria-label="Categorías">
            {categories.map(cat => {
              const isVisible = !hiddenCats.has(cat)
              return (
                <button
                  key={cat}
                  role="listitem"
                  className={`line-legend-item
                    ${hoveredCat === cat ? 'is-hovered' : ''}
                    ${!isVisible ? 'is-dimmed' : ''}`}
                  onClick={() => toggleCat(cat)}
                  aria-pressed={isVisible}
                  onMouseEnter={() => setHoveredCat(cat)}
                  onMouseLeave={() => setHoveredCat(null)}
                >
                  <span
                    className="line-legend-swatch"
                    style={{ background: CATEGORY_COLORS[cat] }}
                  />
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        <div ref={tooltipRef} className="line-chart-tooltip" role="tooltip" aria-live="polite">
          <div className="line-chart-tooltip__category" />
          <div className="line-chart-tooltip__value" />
          <div className="line-chart-tooltip__year" />
        </div>
      </div>
    </section>
  )
}
