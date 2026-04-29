/**
 * HeatmapChart.jsx — Mapa de calor: Intensidad de Denuncias Anuales
 * Filas: Motivo_Agrupado | Columnas: Año | Color: cantidad de denuncias
 * Replicando la visualización de hotmap.jpeg con D3.js y la paleta del proyecto.
 */
import { useEffect, useRef, useMemo, useState } from 'react'
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'
import './HeatmapChart.css'

const CATEGORIES = [
    'COBROS Y FINANZAS',
    'INFORMACION Y CONTRATOS',
    'LOGISTICA Y ENTREGA',
    'OTROS / VARIOS',
    'POSTVENTA Y CALIDAD',
    'SERVICIOS DEFICIENTES',
]

const MARGIN = { top: 20, right: 110, bottom: 50, left: 190 }
const CELL_HEIGHT = 52

function formatNumber(n) {
    return d3.format(',')(n).replace(/,/g, '.')
}

export default function HeatmapChart({ data }) {
    const svgRef = useRef(null)
    const wrapperRef = useRef(null)
    const tooltipRef = useRef(null)
    const [width, setWidth] = useState(0)

    // Agrega: conteo por año × categoría
    const matrix = useMemo(() => {
        const years = [...new Set(data.map(d => d.year))].sort()
        const counts = d3.rollup(
            data,
            v => v.length,
            d => d.groupedMotive,
            d => d.year
        )
        return { years, counts }
    }, [data])

    useEffect(() => {
        if (!svgRef.current || !wrapperRef.current || width === 0) return

        const { years, counts } = matrix
        const totalWidth = width
        const innerW = totalWidth - MARGIN.left - MARGIN.right
        const innerH = CATEGORIES.length * CELL_HEIGHT
        const totalHeight = innerH + MARGIN.top + MARGIN.bottom

        const svg = d3.select(svgRef.current)
        svg.selectAll('*').remove()
        svg
            .attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`)
            .attr('class', 'heatmap-svg')

        const g = svg.append('g')
            .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

        // Escalas
        const xScale = d3.scaleBand()
            .domain(years.map(String))
            .range([0, innerW])
            .padding(0.06)

        const yScale = d3.scaleBand()
            .domain(CATEGORIES)
            .range([0, innerH])
            .padding(0.06)

        // Escala de color: fondo claro → azul primario (paleta del proyecto)
        const maxVal = d3.max(CATEGORIES, cat =>
            d3.max(years, y => counts.get(cat)?.get(y) ?? 0)
        ) ?? 1

        const colorScale = d3.scaleSequential()
            .domain([0, maxVal])
            .interpolator(d3.interpolateRgb('#e7ecef', '#274c77'))

        // Eje X (años)
        g.append('g')
            .attr('class', 'line-axis')
            .attr('transform', `translate(0,${innerH})`)
            .call(d3.axisBottom(xScale).tickSizeOuter(0))
            .call(sel => {
                sel.select('.domain').remove()
                sel.selectAll('text')
                    .attr('class', 'heatmap-axis-label heatmap-axis-label--bold')
                    .attr('dy', '1.2em')
            })

        // Etiqueta eje X
        g.append('text')
            .attr('class', 'heatmap-axis-label')
            .attr('x', innerW / 2)
            .attr('y', innerH + 42)
            .attr('text-anchor', 'middle')
            .text('Año')

        // Eje Y (categorías)
        g.append('g')
            .attr('class', 'line-axis')
            .call(d3.axisLeft(yScale).tickSizeOuter(0))
            .call(sel => {
                sel.select('.domain').remove()
                sel.selectAll('text')
                    .attr('class', 'heatmap-axis-label')
                    .attr('x', -8)
                    .style('font-size', '11px')
            })

        // Etiqueta eje Y
        g.append('text')
            .attr('class', 'heatmap-axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -innerH / 2)
            .attr('y', -165)
            .attr('text-anchor', 'middle')
            .text('Motivo de Denuncia')

        // Celdas
        const cellData = []
        CATEGORIES.forEach(cat => {
            years.forEach(year => {
                cellData.push({ cat, year, value: counts.get(cat)?.get(year) ?? 0 })
            })
        })

        const cells = g.selectAll('.heatmap-cell-group')
            .data(cellData)
            .join('g')
            .attr('class', 'heatmap-cell-group')

        cells.append('rect')
            .attr('class', 'heatmap-cell')
            .attr('x', d => xScale(String(d.year)))
            .attr('y', d => yScale(d.cat))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('rx', 5)
            .attr('fill', d => colorScale(d.value))
            .attr('opacity', 0)
            .on('mousemove', (event, d) => {
                const tip = tooltipRef.current
                if (!tip) return
                tip.querySelector('.heatmap-tooltip__category').textContent = d.cat
                tip.querySelector('.heatmap-tooltip__year').textContent = `Año ${d.year}`
                tip.querySelector('.heatmap-tooltip__value').textContent = `${formatNumber(d.value)} denuncias`
                tip.classList.add('is-visible')
                tip.style.left = `${event.clientX + 14}px`
                tip.style.top = `${event.clientY - 60}px`
            })
            .on('mouseleave', () => {
                if (tooltipRef.current) tooltipRef.current.classList.remove('is-visible')
            })
            .transition()
            .duration(500)
            .delay((_, i) => i * 25)
            .ease(d3.easeCubicOut)
            .attr('opacity', 1)

        // Texto con el valor dentro de cada celda
        cells.append('text')
            .attr('class', 'heatmap-cell-text')
            .attr('x', d => xScale(String(d.year)) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.cat) + yScale.bandwidth() / 2)
            .attr('fill', d => d.value > maxVal * 0.5 ? '#ffffff' : '#274c77')
            .attr('opacity', 0)
            .text(d => formatNumber(d.value))
            .transition()
            .duration(500)
            .delay((_, i) => i * 25 + 200)
            .attr('opacity', 1)

        // Barra de color (leyenda lateral)
        const legendH = innerH
        const legendX = innerW + 20
        const legendW = 14
        const legendSteps = 100

        const defs = svg.append('defs')
        const gradId = 'heatmap-gradient'

        const grad = defs.append('linearGradient')
            .attr('id', gradId)
            .attr('x1', '0%').attr('y1', '100%')
            .attr('x2', '0%').attr('y2', '0%')

        d3.range(legendSteps + 1).forEach(i => {
            grad.append('stop')
                .attr('offset', `${(i / legendSteps) * 100}%`)
                .attr('stop-color', colorScale((i / legendSteps) * maxVal))
        })

        g.append('rect')
            .attr('x', legendX)
            .attr('y', 0)
            .attr('width', legendW)
            .attr('height', legendH)
            .attr('rx', 4)
            .attr('fill', `url(#${gradId})`)

        // Etiquetas de la leyenda
        const legendScale = d3.scaleLinear()
            .domain([0, maxVal])
            .range([legendH, 0])

        g.append('g')
            .attr('transform', `translate(${legendX + legendW},0)`)
            .call(
                d3.axisRight(legendScale)
                    .ticks(4)
                    .tickFormat(d => d >= 1000 ? `${d / 1000}k` : d)
                    .tickSize(4)
            )
            .call(sel => {
                sel.select('.domain').remove()
                sel.selectAll('text').attr('class', 'heatmap-legend-label')
            })

        g.append('text')
            .attr('class', 'heatmap-legend-label')
            .attr('x', legendX + legendW / 2)
            .attr('y', -6)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .text('Volumen')

    }, [matrix, width])

    // ResizeObserver — actualiza el estado `width` para triggear el re-render
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
        <section className="heatmap-section" id="intensidad">
            <div className="container">
                <div className="heatmap-section__header">
                    <div className="heatmap-section__tag">Gráfico 4 de 5</div>
                    <h2 className="heatmap-section__title">
                        Mapa de Calor — Intensidad de Denuncias Anuales
                    </h2>
                    <p className="heatmap-section__subtitle">
                        Intensidad de denuncias por categoría y año. Los tonos más oscuros
                        indican mayor volumen de denuncias registradas en ese período.
                    </p>
                </div>

                <div className="heatmap-card" ref={wrapperRef}>
                    <svg ref={svgRef} className="heatmap-svg" />
                </div>

                <div ref={tooltipRef} className="heatmap-tooltip" role="tooltip" aria-live="polite">
                    <div className="heatmap-tooltip__category" />
                    <div className="heatmap-tooltip__year" />
                    <div className="heatmap-tooltip__value" />
                </div>
            </div>
        </section>
    )
}
