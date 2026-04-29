/**
 * App.jsx — Componente raíz
 * Carga el CSV con D3 y renderiza todos los gráficos del reporte.
 */
import { useState, useEffect } from 'react'
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm'
import Header from './components/Header/Header.jsx'
import Footer from './components/Footer/Footer.jsx'
import Hero from './components/Hero/Hero.jsx'
import ReportIntro from './components/ReportIntro/ReportIntro.jsx'
import BarChart from './components/charts/BarChart/BarChart.jsx'
import PieChart from './components/charts/PieChart/PieChart.jsx'
import RankingChart from './components/charts/RankingChart/RankingChart.jsx'
import HeatmapChart from './components/charts/HeatmapChart/HeatmapChart.jsx'
import LineChart from './components/charts/LineChart/LineChart.jsx'

const CSV_URL = '/data/denuncias.csv'

function App() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        const raw = await d3.dsv(';', CSV_URL, d => ({
          id:            d.DenunciaID,
          year:          +d['Año'],
          date:          d.Fecha_Creacion,
          motive:        d.Motivo_Denuncia,
          sector:        d.Rubro,
          groupedMotive: d.Motivo_Agrupado,
        }))
        if (!cancelled) {
          setData(raw)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error cargando datos:', err)
          setError(err.message)
          setLoading(false)
        }
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p className="loading-text">Cargando datos del reporte…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <h2 className="error-title">No se pudieron cargar los datos</h2>
        <p className="error-message">
          Asegurate de haber copiado el archivo{' '}
          <code>denuncias_consumidor_2019_2022.csv</code> a{' '}
          <code>public/data/denuncias.csv</code>.
        </p>
        <p className="error-message" style={{ fontSize: '0.85rem', opacity: 0.7 }}>
          Detalle técnico: {error}
        </p>
      </div>
    )
  }

  return (
    <div className="app">
      <Header />
      <main>
        <Hero data={data} />
        <ReportIntro />
        <BarChart data={data} />
        <PieChart data={data} />
        <RankingChart data={data} />
        <HeatmapChart data={data} />
        <LineChart data={data} />
      </main>
      <Footer />
    </div>
  )
}

export default App
