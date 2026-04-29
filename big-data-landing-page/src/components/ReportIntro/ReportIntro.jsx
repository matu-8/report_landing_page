/**
 * ReportIntro.jsx — Sección de contexto y descripción del dataset
 * Se muestra entre el Hero y los gráficos para orientar al lector.
 */
import './ReportIntro.css'

const VARIABLES = [
  { name: 'DenunciaID',      desc: 'Identificador único de la denuncia' },
  { name: 'Año',             desc: 'Año de registro (2019–2022)' },
  { name: 'Fecha_Creacion',  desc: 'Fecha exacta de apertura de la denuncia' },
  { name: 'Motivo_Denuncia', desc: 'Descripción completa del motivo declarado' },
  { name: 'Rubro',           desc: 'Sector o industria del proveedor denunciado' },
  { name: 'Motivo_Agrupado', desc: 'Categoría consolidada de 6 grupos temáticos' },
]

const CATEGORIES = [
  { label: 'Servicios Deficientes',    color: '#274c77' },
  { label: 'Cobros y Finanzas',        color: '#6096ba' },
  { label: 'Postventa y Calidad',      color: '#a3cef1' },
  { label: 'Logística y Entrega',      color: '#8b8c89' },
  { label: 'Información y Contratos',  color: '#3a7ca5' },
  { label: 'Otros / Varios',           color: '#b8cfe8' },
]

const DATASET_META = [
  { label: 'Total de registros',   value: '70.571' },
  { label: 'Período',              value: '2019 – 2022' },
  { label: 'Categorías agrupadas', value: '6 grupos' },
  { label: 'Separador CSV',        value: 'Punto y coma (;)' },
]

export default function ReportIntro() {
  return (
    <section className="intro-section" aria-labelledby="intro-title">
      <div className="container">
        <div className="intro-grid">
          {/* Columna izquierda: descripción + variables */}
          <div className="intro-content">
            <div className="intro-eyebrow">Acerca del Dataset</div>
            <h2 className="intro-title" id="intro-title">
              Denuncias al Sistema Nacional de Defensa del Consumidor
            </h2>

            <div className="intro-body">
              <p>
                Este reporte analiza las denuncias registradas por consumidores en Argentina
                entre 2019 y 2022. El dataset contiene información sobre el motivo declarado,
                el rubro del proveedor denunciado y la categoría temática asignada a cada caso.
              </p>
              <p>
                Los datos fueron procesados y agrupados en seis categorías temáticas para
                facilitar el análisis comparativo entre años y la identificación de patrones
                de comportamiento en las denuncias del consumidor.
              </p>
            </div>

            {/* Metadatos del dataset */}
            <div className="intro-data-grid">
              {DATASET_META.map(item => (
                <div key={item.label} className="intro-data-item">
                  <div className="intro-data-item__label">{item.label}</div>
                  <div className="intro-data-item__value">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna derecha: variables + categorías */}
          <div>
            {/* Diccionario de variables */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <p style={{
                fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-sm)'
              }}>
                Variables del dataset
              </p>
              <div className="intro-vars">
                {VARIABLES.map(v => (
                  <div key={v.name} className="intro-var-row">
                    <code className="intro-var-name">{v.name}</code>
                    <span className="intro-var-desc">{v.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categorías agrupadas */}
            <div className="intro-categories">
              <div className="intro-categories__title">Categorías agrupadas</div>
              <div className="intro-categories__list">
                {CATEGORIES.map(c => (
                  <div key={c.label} className="intro-category-badge">
                    <span
                      className="intro-category-dot"
                      style={{ background: c.color }}
                    />
                    {c.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
