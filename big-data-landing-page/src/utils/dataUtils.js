/**
 * dataUtils.js
 * Funciones de parseo y agregación del dataset de denuncias del consumidor.
 * El CSV usa `;` como separador y está en UTF-8.
 *
 * Columnas: DenunciaID | Año | Fecha_Creacion | Motivo_Denuncia | Rubro | ID_Unico | Motivo_Agrupado
 */

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'

/** URL del CSV servido desde public/data/ */
export const CSV_URL = '/data/denuncias.csv'

/** Carga y parsea el CSV */
export async function loadData() {
  const data = await d3.dsv(';', CSV_URL, (d) => ({
    id: d.DenunciaID,
    year: +d['Año'],
    date: d.Fecha_Creacion,
    motive: d.Motivo_Denuncia,
    sector: d.Rubro,
    groupedMotive: d.Motivo_Agrupado,
  }))
  return data
}

/** Total de denuncias */
export function getTotalComplaints(data) {
  return data.length
}

/** Denuncias por año */
export function getComplaintsByYear(data) {
  return d3.rollup(
    data,
    (v) => v.length,
    (d) => d.year
  )
}

/** Años únicos ordenados */
export function getYears(data) {
  return [...new Set(data.map((d) => d.year))].sort()
}

/** Categoría más denunciada (global) */
export function getTopGroupedMotive(data) {
  const counts = d3.rollup(data, (v) => v.length, (d) => d.groupedMotive)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
}

/** Rubro más denunciado (global) */
export function getTopSector(data) {
  const counts = d3.rollup(data, (v) => v.length, (d) => d.sector)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
}

/** Denuncias por año y categoría agrupada — para gráfico de barras */
export function getComplaintsByYearAndCategory(data) {
  const years = getYears(data)
  const categories = [...new Set(data.map((d) => d.groupedMotive))].sort()

  const grouped = d3.rollup(
    data,
    (v) => v.length,
    (d) => d.year,
    (d) => d.groupedMotive
  )

  return { years, categories, grouped }
}

/** Distribución de categorías para un año dado — para gráfico de torta */
export function getCategoryDistributionByYear(data, year) {
  const filtered = year ? data.filter((d) => d.year === year) : data
  const counts = d3.rollup(filtered, (v) => v.length, (d) => d.groupedMotive)
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

/** Top N motivos específicos más denunciados — para ranking */
export function getTopMotives(data, year = null, topN = 10) {
  const filtered = year ? data.filter((d) => d.year === year) : data
  const counts = d3.rollup(filtered, (v) => v.length, (d) => d.motive)
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, topN)
}

/** Porcentaje de variación entre dos años consecutivos */
export function getYearOverYearChange(data, year) {
  const byYear = getComplaintsByYear(data)
  const current = byYear.get(year) ?? 0
  const previous = byYear.get(year - 1) ?? 0
  if (previous === 0) return null
  return ((current - previous) / previous) * 100
}
