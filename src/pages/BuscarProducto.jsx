import { useEffect, useRef, useState } from 'react';
import { getProductos } from '../services/api';
import api from '../services/api';

// Leaflet se importa dinámicamente para evitar SSR issues
// Asegúrate de tener en tu index.html o equivalente:
// <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
// <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

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
function MapaLeaflet({ tiendas, ubicacion, tiendaActiva, onTiendaClick }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;
    if (!window.L) return;

    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [19.4326, -99.1332], // CDMX por defecto
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    instanceRef.current = map;

    return () => {
      map.remove();
      instanceRef.current = null;
    };
  }, []);

  // Actualizar marcadores de tiendas
  useEffect(() => {
    const L = window.L;
    if (!instanceRef.current || !L) return;

    const map = instanceRef.current;

    // Limpiar marcadores anteriores
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = [];

    tiendas.forEach((item, i) => {
      const t = item.tiendas || {};
      if (!t.latitud || !t.longitud) return;

      const isActiva = tiendaActiva === i;

      const icono = L.divIcon({
        className: '',
        html: `
          <div style="
            background: ${isActiva ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            width: ${isActiva ? 36 : 28}px;
            height: ${isActiva ? 36 : 28}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: ${isActiva ? 14 : 11}px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.35);
            border: 2px solid white;
            transition: all 0.2s;
          ">
            <span style="transform: rotate(45deg)">${i + 1}</span>
          </div>`,
        iconSize: [isActiva ? 36 : 28, isActiva ? 36 : 28],
        iconAnchor: [isActiva ? 18 : 14, isActiva ? 36 : 28],
        popupAnchor: [0, -(isActiva ? 36 : 28)],
      });

      const marker = L.marker([t.latitud, t.longitud], { icon: icono })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; min-width: 180px;">
            <b style="font-size: 14px;">${t.nombre_tienda || 'Tienda'}</b><br/>
            <span style="color:#64748b; font-size:12px;">${[t.calle, t.numero_exterior, t.colonia].filter(Boolean).join(', ')}</span><br/>
            <span style="color:#16a34a; font-weight:600;">Stock: ${item.stock_actual}</span>
            ${item.km != null ? `<br/><span style="color:#3b82f6;">📍 ${distanciaTexto(item.km)}</span>` : ''}
          </div>
        `)
        .on('click', () => onTiendaClick(i));

      markersRef.current.push(marker);
      bounds.push([t.latitud, t.longitud]);
    });

    // Ajustar vista
    if (bounds.length > 0) {
      if (ubicacion) bounds.push([ubicacion.lat, ubicacion.lon]);
      try {
        map.fitBounds(bounds, { padding: [40, 40] });
      } catch {}
    }
  }, [tiendas, tiendaActiva]);

  // Marcador de usuario
  useEffect(() => {
    const L = window.L;
    if (!instanceRef.current || !L || !ubicacion) return;

    if (userMarkerRef.current) userMarkerRef.current.remove();

    const iconoUser = L.divIcon({
      className: '',
      html: `
        <div style="
          width: 18px; height: 18px;
          background: #8b5cf6;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.4), 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    userMarkerRef.current = L.marker([ubicacion.lat, ubicacion.lon], { icon: iconoUser })
      .addTo(instanceRef.current)
      .bindPopup('<b>📍 Tu ubicación</b>');
  }, [ubicacion]);

  // Abrir popup al hacer click en lista
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
      style={{
        width: '100%',
        height: 380,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        border: '1px solid #e2e8f0',
      }}
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

  // Cargar Leaflet dinámicamente si no está
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

  // ── AUTOCOMPLETADO ────────────────────────────
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

  // ── SELECCIONAR PRODUCTO ──────────────────────
  const seleccionarProducto = async (p) => {
    setProductoSel(p);
    setBusqueda(p.nombre_producto);
    setSugerencias([]);
    setCargando(true);
    setTiendaActiva(null);

    try {
      const r = await api.get(`/buscar-producto/${p.codigo_producto}`);
      setTiendas(r.data || []);
    } catch (err) {
      console.error(err);
      alert('Error al buscar tiendas');
      setTiendas([]);
    } finally {
      setCargando(false);
    }
  };

  // ── UBICACIÓN ─────────────────────────────────
  const obtenerUbicacion = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setUbicacion({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    });
  };

  // ── ORDENAR POR DISTANCIA ─────────────────────
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

  const hayMapa = productoSel && !cargando && tiendasOrdenadas.some(
    (item) => item.tiendas?.latitud
  );

  return (
    <div style={{ maxWidth: 900, margin: 'auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: 16 }}>🔍 Buscar Producto</h2>

      {/* INPUT */}
      <div style={{ position: 'relative' }}>
        <input
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setProductoSel(null); setTiendas([]); }}
          style={{
            width: '100%',
            padding: '10px 14px',
            fontSize: 15,
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            boxSizing: 'border-box',
          }}
        />

        {/* SUGERENCIAS */}
        {sugerencias.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: 260,
            overflowY: 'auto',
          }}>
            {sugerencias.map((p) => (
              <div
                key={p.codigo_producto}
                onClick={() => seleccionarProducto(p)}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                {p.nombre_producto}
              </div>
            ))}
          </div>
        )}
      </div>

      <br />

      {/* BOTÓN UBICACIÓN */}
      <button
        onClick={obtenerUbicacion}
        style={{
          padding: '8px 16px',
          background: ubicacion ? '#8b5cf6' : '#f1f5f9',
          color: ubicacion ? 'white' : '#334155',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        📍 {ubicacion ? 'Ubicación activa' : 'Usar mi ubicación'}
      </button>

      {/* RESULTADOS */}
      {productoSel && (
        <>
          <h3 style={{ marginTop: 24, marginBottom: 12 }}>{productoSel.nombre_producto}</h3>

          {cargando && (
            <p style={{ color: '#64748b' }}>Cargando tiendas...</p>
          )}

          {/* MAPA */}
          {hayMapa && leafletListo && (
            <div style={{ marginBottom: 20 }}>
              <MapaLeaflet
                tiendas={tiendasOrdenadas}
                ubicacion={ubicacion}
                tiendaActiva={tiendaActiva}
                onTiendaClick={setTiendaActiva}
              />
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                Haz clic en un marcador o en una tienda de la lista para destacarla en el mapa.
              </p>
            </div>
          )}

          {/* LISTA DE TIENDAS */}
          {tiendasOrdenadas.map((item, i) => {
            const t = item.tiendas || {};
            const direccion = formatDireccion(t);
            const isActiva = tiendaActiva === i;

            return (
              <div
                key={i}
                onClick={() => setTiendaActiva(isActiva ? null : i)}
                style={{
                  borderBottom: '1px solid #e2e8f0',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  background: isActiva ? '#eff6ff' : 'white',
                  borderLeft: isActiva ? '3px solid #3b82f6' : '3px solid transparent',
                  borderRadius: 6,
                  marginBottom: 4,
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
                onMouseEnter={(e) => { if (!isActiva) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={(e) => { if (!isActiva) e.currentTarget.style.background = 'white'; }}
              >
                {/* Número */}
                <div style={{
                  minWidth: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: isActiva ? '#3b82f6' : '#e2e8f0',
                  color: isActiva ? 'white' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 15 }}>{t.nombre_tienda}</b>
                  <br />
                  {direccion && (
                    <span style={{ fontSize: 12, color: '#64748b' }}>{direccion}<br /></span>
                  )}
                  <span style={{ fontSize: 13 }}>
                    Stock disponible: <b style={{ color: item.stock_actual > 0 ? '#16a34a' : '#dc2626' }}>
                      {item.stock_actual}
                    </b>
                  </span>

                  {item.km != null && (
                    <span style={{
                      marginLeft: 12,
                      fontSize: 13,
                      color: '#3b82f6',
                      fontWeight: 500,
                    }}>
                      📍 {distanciaTexto(item.km)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {!cargando && tiendasOrdenadas.length === 0 && (
            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
              No se encontraron tiendas con este producto disponible.
            </p>
          )}
        </>
      )}
    </div>
  );
}