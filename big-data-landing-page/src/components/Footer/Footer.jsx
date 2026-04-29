/**
 * Footer.jsx — Pie de página
 */
import './Footer.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__inner">
          {/* Brand y descripción */}
          <div className="footer__brand">
            <h3 className="footer__title">
              Reporte — Denuncias del Consumidor
            </h3>
            <p className="footer__description">
              Análisis interactivo del dataset de denuncias registradas en Argentina
              entre 2019 y 2022. Visualizaciones desarrolladas con D3.js para el
              Seminario de Big Data.
            </p>
          </div>

          {/* Meta info */}
          <div className="footer__meta">
            <span className="footer__meta-badge">📁 70.571 registros</span>
            <span>Dataset: 2019 – 2022</span>
            <span>Período de análisis</span>
          </div>

          <div className="footer__divider" />

          {/* Bottom bar */}
          <div className="footer__bottom">
            <span>© {currentYear} Seminario de Big Data</span>
            <div className="footer__tech">
              <span className="footer__tech-item">⚛ React</span>
              <span className="footer__tech-item">⚡ Vite</span>
              <span className="footer__tech-item">📈 D3.js</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
