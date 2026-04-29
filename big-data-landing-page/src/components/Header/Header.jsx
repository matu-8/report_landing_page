/**
 * Header.jsx — Barra de navegación fija
 */
import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <div className="container header__inner">
        {/* Brand */}
        <a href="#inicio" className="header__brand">
          <div className="header__brand-icon">📊</div>
          <div className="header__brand-text">
            <span className="header__brand-title">Denuncias del Consumidor</span>
            <span className="header__brand-subtitle">Seminario de Big Data</span>
          </div>
        </a>

        {/* Navegación */}
        <nav className="header__nav" aria-label="Navegación principal">
          <a href="#resumen" className="header__nav-link">Resumen</a>
          <a href="#evolucion" className="header__nav-link">Evolución</a>
          <a href="#distribucion" className="header__nav-link">Distribución</a>
          <a href="#ranking" className="header__nav-link">Ranking</a>
        </nav>

        {/* Badge de período */}
        <div className="header__badge" aria-label="Período del reporte">
          <span className="header__badge-dot" />
          2019 — 2022
        </div>
      </div>
    </header>
  )
}
