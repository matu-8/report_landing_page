/**
 * BarChart.jsx — Gráfico de barras agrupadas
 * Muestra la evolución de denuncias por Motivo_Agrupado y Año (2019-2022)
 * Replicando la visualización del notebook graficos_df.ipynb con D3.js
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'
import './BarChart.css'

// Paleta de colores de la aplicación asignada a cada categoría
const CATEGORY_COLORS = {
  'SERVICIOS DEFICIENTES':    '#274c77',
  'COBROS Y FINANZAS':        '#6096ba',
  'POSTVENTA Y CALIDAD':      '#a3cef1',
  'LOGISTICA Y ENTREGA':      '#8b8c89',
  'INFORMACION Y CONTRATOS':  '#3a7ca5',
  'OTROS / VARIOS':           '#b8cfe8',
}

const MARGIN = { top: 24, right: 20, bottom: 48, left: 64 }

function formatNumber(n) {
  return d3.format(',')(n).replace(/,/g, '.')
}

export default function BarChart({ data }) {
  const svgRef = useRef(null)
  const wrapperRef = useRef(null)
  const tooltipRef = useRef(null)
  const [activeCategories, setActiveCategories] = useState(new Set())
  const [hoveredCategory, setHoveredCategory] = useState(null)

  // Agrega datos: cantidad de denuncias por año y categoría
  const { years, categories, matrix } = (() => {
    const years = [...new Set(data.map(d => d.year))].sort()
    const categories = Object.keys(CATEGORY_COLORS)
    const counts = d3.rollup(
      data,
      v => v.length,
      d => d.year,
      d => d.groupedMotive
    )
    const matrix = years.map(year =>
      Object.fromEntries([
        ['year', year],
        ...categories.map(cat => [cat, counts.get(year)?.get(cat) ?? 0])
      ])
    )
    return { years, categories, matrix }
  })()

  // Categorías visibles (todas por defecto)
  const visibleCategories = categories.filter(c => !activeCategories.has(c))

  const toggleCategory = useCallback((cat) => {
    setActiveCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  // Renderizado con D3
  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current) return

    const wrapper = wrapperRef.current
    const totalWidth = wrapper.clientWidth || 800
    const totalHeight = Math.max(340, Math.min(420, totalWidth * 0.48))
    const width = totalWidth - MARGIN.left - MARGIN.right
    const height = totalHeight - MARGIN.top - MARGIN.bottom

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    svg
      .attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`)
      .attr('class', `bar-chart-svg ${hoveredCategory ? 'has-hover' : ''}`)

    const g = svg.append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    // Escala X exterior (años)
    const xOuter = d3.scaleBand()
      .domain(years.map(String))
      .range([0, width])
      .paddingInner(0.22)
      .paddingOuter(0.1)

    // Escala X interior (categorías dentro de cada año)
    const xInner = d3.scaleBand()
      .domain(visibleCategories)
      .range([0, xOuter.bandwidth()])
      .padding(0.08)

    // Máximo para Y
    const maxVal = d3.max(matrix, row =>
      d3.max(visibleCategories, cat => row[cat] ?? 0)
    ) ?? 0

    // Escala Y
    const yScale = d3.scaleLinear()
      .domain([0, maxVal * 1.1])
      .nice()
      .range([height, 0])

    // Grid lines horizontales
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(yScale)
          .tickSize(-width)
          .tickFormat('')
          .ticks(5)
      )
      .call(sel => {
        sel.select('.domain').remove()
        sel.selectAll('line').attr('class', 'grid-line')
      })

    // Eje X
    g.append('g')
      .attr('class', 'axis-x')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xOuter).tickSizeOuter(0))
      .call(sel => {
        sel.select('.domain').attr('stroke', 'var(--color-border)')
        sel.selectAll('text')
          .attr('class', 'year-label')
          .attr('dy', '1.4em')
      })

    // Eje Y
    g.append('g')
      .attr('class', 'axis-y')
      .call(
        d3.axisLeft(yScale)
          .ticks(5)
          .tickFormat(d => d >= 1000 ? `${d / 1000}k` : d)
      )
      .call(sel => {
        sel.select('.domain').attr('stroke', 'var(--color-border)')
      })

    // Etiqueta eje Y
    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .text('Número de Denuncias')

    // Grupos por año
    const yearGroups = g.selectAll('.year-group')
      .data(matrix)
      .join('g')
      .attr('class', 'year-group')
      .attr('transform', d => `translate(${xOuter(String(d.year))},0)`)

    // Barras
    yearGroups.selectAll('.bar')
      .data(d => visibleCategories.map(cat => ({
        category: cat,
        value: d[cat] ?? 0,
        year: d.year,
      })))
      .join('rect')
      .attr('class', d =>
        `bar ${hoveredCategory === d.category ? 'bar--hovered' : ''}`
      )
      .attr('x', d => xInner(d.category))
      .attr('width', xInner.bandwidth())
      .attr('y', d => yScale(d.value))
      .attr('height', d => height - yScale(d.value))
      .attr('rx', 3)
      .attr('fill', d => CATEGORY_COLORS[d.category] ?? '#274c77')
      .on('mousemove', (event, d) => {
        const tooltip = tooltipRef.current
        if (!tooltip) return
        tooltip.querySelector('.bar-chart-tooltip__category').textContent = d.category
        tooltip.querySelector('.bar-chart-tooltip__value').textContent = formatNumber(d.value)
        tooltip.querySelector('.bar-chart-tooltip__year').textContent = `Año ${d.year}`
        tooltip.classList.add('is-visible')
        tooltip.style.left = `${event.clientX + 14}px`
        tooltip.style.top = `${event.clientY - 60}px`
        setHoveredCategory(d.category)
      })
      .on('mouseleave', () => {
        if (tooltipRef.current) tooltipRef.current.classList.remove('is-visible')
        setHoveredCategory(null)
      })

    // Animación de entrada
    yearGroups.selectAll('.bar')
      .attr('y', height)
      .attr('height', 0)
      .transition()
      .duration(600)
      .delay((_, i) => i * 30)
      .ease(d3.easeCubicOut)
      .attr('y', d => yScale(d.value))
      .attr('height', d => height - yScale(d.value))

  }, [data, visibleCategories, hoveredCategory, years, matrix])

  // Resize observer
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const ro = new ResizeObserver(() => {
      if (svgRef.current) {
        svgRef.current.dispatchEvent(new Event('resize'))
      }
    })
    ro.observe(wrapper)
    return () => ro.disconnect()
  }, [])

  return (
    <section className="bar-chart-section" id="evolucion">
      <div className="container">
        <div className="bar-chart-section__header">
          <div className="bar-chart-section__tag">Gráfico 1 de 5</div>
          <h2 className="bar-chart-section__title">
            Evolución de Motivos de Denuncia (2019–2022)
          </h2>
          <p className="bar-chart-section__subtitle">
            Comparación anual de la cantidad de denuncias por categoría agrupada.
            Hacé clic en la leyenda para mostrar u ocultar categorías.
          </p>
        </div>

        <div className="bar-chart-wrapper" ref={wrapperRef}>
          <svg ref={svgRef} className="bar-chart-svg" />

          {/* Leyenda interactiva */}
          <div className="bar-chart-legend" role="list" aria-label="Categorías del gráfico">
            {categories.map(cat => {
              const isActive = !activeCategories.has(cat)
              return (
                <button
                  key={cat}
                  role="listitem"
                  className={`bar-chart-legend__item ${isActive ? 'is-active' : 'is-dimmed'}`}
                  onClick={() => toggleCategory(cat)}
                  aria-pressed={isActive}
                  title={isActive ? `Ocultar ${cat}` : `Mostrar ${cat}`}
                >
                  <span
                    className="bar-chart-legend__swatch"
                    style={{ background: CATEGORY_COLORS[cat] }}
                  />
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tooltip (fuera del SVG para evitar clipping) */}
        <div ref={tooltipRef} className="bar-chart-tooltip" role="tooltip" aria-live="polite">
          <div className="bar-chart-tooltip__category" />
          <div className="bar-chart-tooltip__value" />
          <div className="bar-chart-tooltip__year" />
        </div>
      </div>
    </section>
  )
}
