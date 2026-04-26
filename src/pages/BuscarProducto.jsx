import { useEffect, useRef, useState } from 'react';
import { getProductos } from '../services/api';
import api from '../services/api';

// ── ESTILOS RESPONSIVOS GLOBALES ──────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .buscador-wrap {
    max-width: 960px;
    margin: 0 auto;
    padding: 24px 16px;
    font-family: 'DM Sans', sans-serif;
    color: #1e293b;
  }

  .buscador-titulo {
    font-size: clamp(20px, 4vw, 28px);
    font-weight: 700;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* INPUT */
  .input-busqueda {
    width: 100%;
    padding: 12px 16px;
    font-size: 15px;
    font-family: 'DM Sans', sans-serif;
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    background: #fff;
  }
  .input-busqueda:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
  }

  /* SUGERENCIAS */
  .sugerencias {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: white;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.10);
    z-index: 1000;
    max-height: 240px;
    overflow-y: auto;
  }
  .sugerencia-item {
    padding: 11px 16px;
    cursor: pointer;
    border-bottom: 1px solid #f1f5f9;
    font-size: 14px;
    transition: background 0.12s;
  }
  .sugerencia-item:last-child { border-bottom: none; }
  .sugerencia-item:hover { background: #f0f9ff; }

  /* BOTÓN UBICACIÓN */
  .btn-ubicacion {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 18px;
    border: none;
    border-radius: 9px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 14px;
    transition: background 0.2s, transform 0.1s;
    margin-top: 12px;
    white-space: nowrap;
  }
  .btn-ubicacion:active { transform: scale(0.97); }

  /* LAYOUT RESULTADO */
  .resultado-header {
    margin-top: 28px;
    margin-bottom: 14px;
    font-size: clamp(16px, 3vw, 20px);
    font-weight: 700;
    color: #1e293b;
  }

  /* LAYOUT MAPA + LISTA */
  .resultado-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  @media (min-width: 680px) {
    .resultado-layout {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
    .mapa-col { position: sticky; top: 16px; }
  }

  @media (min-width: 900px) {
    .resultado-layout {
      grid-template-columns: 1.1fr 0.9fr;
    }
  }

  /* MAPA */
  .mapa-contenedor {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.10);
    border: 1.5px solid #e2e8f0;
    width: 100%;
  }
  .mapa-hint {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 6px;
    padding: 0 2px;
  }

  /* LISTA TIENDAS */
  .lista-tiendas {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .tienda-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1.5px solid transparent;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }
  .tienda-card:hover { background: #f8fafc; }
  .tienda-card.activa {
    background: #eff6ff;
    border-color: #3b82f6;
    box-shadow: 0 2px 10px rgba(59,130,246,0.12);
  }

  .tienda-num {
    min-width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 12px;
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s;
  }

  .tienda-nombre {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.3;
  }
  .tienda-dir {
    font-size: 12px;
    color: #64748b;
    margin-top: 2px;
    line-height: 1.4;
  }
  .tienda-meta {
    margin-top: 5px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .badge-stock {
    font-size: 12px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 20px;
  }
  .badge-dist {
    font-size: 12px;
    color: #3b82f6;
    font-weight: 500;
  }

  /* CARGANDO */
  .skeleton {
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.2s infinite;
    border-radius: 8px;
    height: 68px;
    margin-bottom: 6px;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* VACÍO */
  .estado-vacio {
    text-align: center;
    padding: 32px 16px;
    color: #94a3b8;
    font-size: 14px;
  }
`;

// ── DISTANCIA ─────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanciaTexto(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// ── MAPA LEAFLET ───────────────────────────────────
function MapaLeaflet({ tiendas, ubicacion, tiendaActiva, onTiendaClick, altura }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;
    if (!window.L) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [19.4326, -99.1332],
      zoom: 12,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    instanceRef.current = map;
    return () => { map.remove(); instanceRef.current = null; };
  }, []);

  useEffect(() => {
    const L = window.L;
    if (!instanceRef.current || !L) return;
    const map = instanceRef.current;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const bounds = [];
    tiendas.forEach((item, i) => {
      const t = item.tiendas || {};
      if (!t.latitud || !t.longitud) return;
      const isActiva = tiendaActiva === i;
      const icono = L.divIcon({
        className: '',
        html: `<div style="
          background:${isActiva ? '#ef4444' : '#3b82f6'};
          color:white;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          width:${isActiva ? 34 : 26}px;height:${isActiva ? 34 : 26}px;
          display:flex;align-items:center;justify-content:center;
          font-weight:700;font-size:${isActiva ? 13 : 10}px;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">
          <span style="transform:rotate(45deg)">${i + 1}</span></div>`,
        iconSize: [isActiva ? 34 : 26, isActiva ? 34 : 26],
        iconAnchor: [isActiva ? 17 : 13, isActiva ? 34 : 26],
        popupAnchor: [0, -(isActiva ? 34 : 26)],
      });
      const marker = L.marker([t.latitud, t.longitud], { icon: icono })
        .addTo(map)
        .bindPopup(`<div style="font-family:'DM Sans',sans-serif;min-width:160px;">
          <b style="font-size:13px;">${t.nombre_tienda || 'Tienda'}</b><br/>
          <span style="color:#64748b;font-size:11px;">${[t.calle, t.numero_exterior, t.colonia].filter(Boolean).join(', ')}</span><br/>
          <span style="color:#16a34a;font-weight:600;font-size:12px;">Stock: ${item.stock_actual}</span>
          ${item.km != null ? `<br/><span style="color:#3b82f6;font-size:12px;">📍 ${distanciaTexto(item.km)}</span>` : ''}
        </div>`)
        .on('click', () => onTiendaClick(i));
      markersRef.current.push(marker);
      bounds.push([t.latitud, t.longitud]);
    });
    if (bounds.length > 0) {
      if (ubicacion) bounds.push([ubicacion.lat, ubicacion.lon]);
      try { map.fitBounds(bounds, { padding: [40, 40] }); } catch {}
    }
  }, [tiendas, tiendaActiva]);

  useEffect(() => {
    const L = window.L;
    if (!instanceRef.current || !L || !ubicacion) return;
    if (userMarkerRef.current) userMarkerRef.current.remove();
    const iconoUser = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;background:#8b5cf6;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(139,92,246,0.4),0 2px 8px rgba(0,0,0,0.25);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    userMarkerRef.current = L.marker([ubicacion.lat, ubicacion.lon], { icon: iconoUser })
      .addTo(instanceRef.current)
      .bindPopup('<b>📍 Tu ubicación</b>');
  }, [ubicacion]);

  useEffect(() => {
    if (tiendaActiva === null || !instanceRef.current) return;
    const marker = markersRef.current[tiendaActiva];
    if (marker) {
      marker.openPopup();
      instanceRef.current.panTo(marker.getLatLng(), { animate: true, duration: 0.5 });
    }
  }, [tiendaActiva]);

  return (
    <div
      ref={mapRef}
      className="mapa-contenedor"
      style={{ height: altura || 340 }}
    />
  );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────
export default function BuscarProducto() {
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [productoSel, setProductoSel] = useState(null);
  const [tiendas, setTiendas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [ubicacion, setUbicacion] = useState(null);
  const [tiendaActiva, setTiendaActiva] = useState(null);
  const [leafletListo, setLeafletListo] = useState(!!window.L);
  const [ancho, setAncho] = useState(window.innerWidth);

  // Detectar ancho de pantalla
  useEffect(() => {
    const handler = () => setAncho(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Leaflet dinámico
  useEffect(() => {
    if (window.L) { setLeafletListo(true); return; }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletListo(true);
    document.head.appendChild(script);
  }, []);

  // Autocompletado
  useEffect(() => {
    if (busqueda.length < 2) { setSugerencias([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await getProductos({ search: busqueda, activo: true });
        setSugerencias(r.data || []);
      } catch { setSugerencias([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  const seleccionarProducto = async (p) => {
    setProductoSel(p);
    setBusqueda(p.nombre_producto);
    setSugerencias([]);
    setCargando(true);
    setTiendaActiva(null);
    try {
      const r = await api.get(`/buscar-producto/${p.codigo_producto}`);
      setTiendas(r.data || []);
    } catch {
      alert('Error al buscar tiendas');
      setTiendas([]);
    } finally {
      setCargando(false);
    }
  };

  const obtenerUbicacion = () => {
    navigator.geolocation.getCurrentPosition((pos) =>
      setUbicacion({ lat: pos.coords.latitude, lon: pos.coords.longitude })
    );
  };

  const tiendasOrdenadas = tiendas
    .map((item) => {
      const t = item.tiendas || {};
      return {
        ...item,
        km: ubicacion && t.latitud
          ? haversine(ubicacion.lat, ubicacion.lon, t.latitud, t.longitud)
          : null,
      };
    })
    .sort((a, b) => (a.km ?? 9999) - (b.km ?? 9999));

  const formatDireccion = (t) => {
    if (!t) return '';
    return [t.calle, t.numero_exterior, t.colonia, t.municipio, t.estado]
      .filter(Boolean).join(', ');
  };

  const hayMapa = productoSel && !cargando &&
    tiendasOrdenadas.some((item) => item.tiendas?.latitud);
  const esMobile = ancho < 680;
  const alturaMapaMobile = 260;
  const alturaMapaDesktop = 400;

  return (
    <>
      <style>{globalStyles}</style>

      <div className="buscador-wrap">
        <h2 className="buscador-titulo">
          <span>🔍</span> Buscar Producto
        </h2>

        {/* INPUT + SUGERENCIAS */}
        <div style={{ position: 'relative' }}>
          <input
            className="input-busqueda"
            placeholder="Escribe el nombre del producto..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setProductoSel(null);
              setTiendas([]);
            }}
          />
          {sugerencias.length > 0 && (
            <div className="sugerencias">
              {sugerencias.map((p) => (
                <div
                  key={p.codigo_producto}
                  className="sugerencia-item"
                  onClick={() => seleccionarProducto(p)}
                >
                  {p.nombre_producto}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BOTÓN UBICACIÓN */}
        <button
          className="btn-ubicacion"
          onClick={obtenerUbicacion}
          style={{
            background: ubicacion ? '#8b5cf6' : '#f1f5f9',
            color: ubicacion ? 'white' : '#334155',
          }}
        >
          📍 {ubicacion ? 'Ubicación activa' : 'Usar mi ubicación'}
        </button>

        {/* RESULTADOS */}
        {productoSel && (
          <>
            <h3 className="resultado-header">{productoSel.nombre_producto}</h3>

            {/* SKELETON mientras carga */}
            {cargando && (
              <div>
                {[1, 2, 3].map((k) => <div key={k} className="skeleton" />)}
              </div>
            )}

            {!cargando && tiendasOrdenadas.length > 0 && (
              <div className="resultado-layout">

                {/* COLUMNA MAPA (en mobile va arriba full-width) */}
                {hayMapa && leafletListo && (
                  <div className="mapa-col">
                    <MapaLeaflet
                      tiendas={tiendasOrdenadas}
                      ubicacion={ubicacion}
                      tiendaActiva={tiendaActiva}
                      onTiendaClick={setTiendaActiva}
                      altura={esMobile ? alturaMapaMobile : alturaMapaDesktop}
                    />
                    <p className="mapa-hint">
                      Toca un marcador o una tienda de la lista para destacarla.
                    </p>
                  </div>
                )}

                {/* COLUMNA LISTA */}
                <div className="lista-tiendas">
                  {tiendasOrdenadas.map((item, i) => {
                    const t = item.tiendas || {};
                    const isActiva = tiendaActiva === i;
                    const conStock = item.stock_actual > 0;

                    return (
                      <div
                        key={i}
                        className={`tienda-card${isActiva ? ' activa' : ''}`}
                        onClick={() => setTiendaActiva(isActiva ? null : i)}
                      >
                        <div
                          className="tienda-num"
                          style={{
                            background: isActiva ? '#3b82f6' : '#e2e8f0',
                            color: isActiva ? 'white' : '#64748b',
                          }}
                        >
                          {i + 1}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="tienda-nombre">{t.nombre_tienda}</div>
                          {formatDireccion(t) && (
                            <div className="tienda-dir">{formatDireccion(t)}</div>
                          )}
                          <div className="tienda-meta">
                            <span
                              className="badge-stock"
                              style={{
                                background: conStock ? '#dcfce7' : '#fee2e2',
                                color: conStock ? '#15803d' : '#b91c1c',
                              }}
                            >
                              {conStock ? `✓ Stock: ${item.stock_actual}` : '✕ Sin stock'}
                            </span>
                            {item.km != null && (
                              <span className="badge-dist">
                                📍 {distanciaTexto(item.km)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!cargando && tiendasOrdenadas.length === 0 && (
              <div className="estado-vacio">
                <div style={{ fontSize: 36, marginBottom: 8 }}>🏪</div>
                No se encontraron tiendas con este producto disponible.
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
