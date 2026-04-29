/**
 * Hero.jsx — Sección principal con KPI cards
 * Recibe el dataset completo y calcula los indicadores clave.
 */
import { useMemo } from 'react'
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'
import './Hero.css'

/** Formatea números grandes con puntos de miles */
function formatNumber(n) {
  return d3.format(',')(n).replace(/,/g, '.')
}

/** Calcula estadísticas de KPI a partir del dataset */
function computeKPIs(data) {
  const total = data.length

  // Denuncias por año
  const byYear = d3.rollup(data, (v) => v.length, (d) => d.year)
  const years = [...byYear.keys()].sort()
  const latestYear = years[years.length - 1]
  const prevYear = years[years.length - 2]
  const latestCount = byYear.get(latestYear) ?? 0
  const prevCount = byYear.get(prevYear) ?? 1
  const yoyChange = ((latestCount - prevCount) / prevCount) * 100

  // Categoría más denunciada (global)
  const byCategory = d3.rollup(data, (v) => v.length, (d) => d.groupedMotive)
  const topCategory = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0]

  // Rubro más denunciado (global)
  const bySector = d3.rollup(data, (v) => v.length, (d) => d.sector)
  const topSector = [...bySector.entries()].sort((a, b) => b[1] - a[1])[0]

  return { total, latestYear, latestCount, yoyChange, topCategory, topSector, years }
}

export default function Hero({ data }) {
  const kpis = useMemo(() => computeKPIs(data), [data])

  return (
    <section className="hero" id="inicio" aria-label="Resumen del reporte">
      <div className="container hero__inner">
        {/* Eyebrow */}
        <div className="hero__eyebrow">
          📋 Reporte Interactivo · Argentina
        </div>

        {/* Título */}
        <h1 className="hero__title">
          Denuncias del{' '}
          <span className="hero__title-highlight">Consumidor</span>
          <br />
          2019 — 2022
        </h1>

        {/* Subtítulo */}
        <p className="hero__subtitle">
          Análisis de <strong style={{ color: '#fff' }}>{formatNumber(kpis.total)}</strong> denuncias
          registradas en Argentina. Explorá la evolución temporal, los motivos más frecuentes
          y las categorías con mayor impacto en el consumidor.
        </p>

        <div className="hero__divider" />

        {/* KPI Grid */}
        <div className="hero__kpis" id="resumen">
          {/* KPI 1 — Total de denuncias */}
          <div className="kpi-card">
            <span className="kpi-card__icon">📁</span>
            <div className="kpi-card__label">Total de denuncias</div>
            <div className="kpi-card__value">{formatNumber(kpis.total)}</div>
            <div className="kpi-card__detail">
              Período {kpis.years[0]} – {kpis.years[kpis.years.length - 1]}
            </div>
          </div>

          {/* KPI 2 — Denuncias último año */}
          <div className="kpi-card">
            <span className="kpi-card__icon">📅</span>
            <div className="kpi-card__label">Denuncias en {kpis.latestYear}</div>
            <div className="kpi-card__value kpi-card__value--accent">
              {formatNumber(kpis.latestCount)}
            </div>
            <div
              className={`kpi-card__change ${kpis.yoyChange >= 0 ? 'kpi-card__change--up' : 'kpi-card__change--down'}`}
            >
              {kpis.yoyChange >= 0 ? '▲' : '▼'} {Math.abs(kpis.yoyChange).toFixed(1)}% vs {kpis.latestYear - 1}
            </div>
          </div>

          {/* KPI 3 — Categoría más denunciada */}
          <div className="kpi-card">
            <span className="kpi-card__icon">🏆</span>
            <div className="kpi-card__label">Categoría más denunciada</div>
            <div className="kpi-card__value" style={{ fontSize: 'clamp(0.9rem, 1.8vw, 1.25rem)', fontWeight: 800 }}>
              {kpis.topCategory?.[0] ?? '—'}
            </div>
            <div className="kpi-card__detail">
              {formatNumber(kpis.topCategory?.[1] ?? 0)} denuncias
            </div>
          </div>

          {/* KPI 4 — Rubro más denunciado */}
          <div className="kpi-card">
            <span className="kpi-card__icon">🏢</span>
            <div className="kpi-card__label">Rubro más denunciado</div>
            <div
              className="kpi-card__value"
              style={{ fontSize: 'clamp(0.75rem, 1.4vw, 1rem)', fontWeight: 800, lineHeight: 1.25 }}
            >
              {kpis.topSector?.[0] ?? '—'}
            </div>
            <div className="kpi-card__detail">
              {formatNumber(kpis.topSector?.[1] ?? 0)} denuncias
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
