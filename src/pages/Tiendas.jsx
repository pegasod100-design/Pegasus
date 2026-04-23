import { useEffect, useState, useRef, useCallback } from 'react';
import { getTiendas, createTienda, updateTienda, deleteTienda } from '../services/api';

// ─── Leaflet se carga dinámicamente para no romper SSR ───────────────────────
let L = null;
const loadLeaflet = async () => {
  if (L) return L;
  if (typeof window === 'undefined') return null;
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
  const mod = await import('leaflet');
  L = mod.default ?? mod;
  return L;
};

// ─── Nominatim helpers ────────────────────────────────────────────────────────
const NOMINATIM = 'https://nominatim.openstreetmap.org';

async function buscarColoniasPorCP(cp) {
  const url = `${NOMINATIM}/search?format=json&country=mx&postalcode=${cp}&addressdetails=1&limit=20`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
  const data = await res.json();
  // Extraemos colonias únicas del resultado
  const colonias = [];
  const vistas = new Set();
  for (const r of data) {
    const col =
      r.address?.suburb ||
      r.address?.neighbourhood ||
      r.address?.quarter ||
      r.address?.village ||
      r.address?.hamlet ||
      r.address?.city_district;
    const municipio =
      r.address?.city || r.address?.town || r.address?.municipality || r.address?.county || '';
    const estado = r.address?.state || '';
    if (col && !vistas.has(col)) {
      vistas.add(col);
      colonias.push({
        colonia: col,
        municipio,
        estado,
        lat: parseFloat(r.lat),
        lon: parseFloat(r.lon),
        display: r.display_name,
      });
    }
  }
  // Si no hay colonias distinguibles, devolvemos el primer resultado genérico
  if (colonias.length === 0 && data.length > 0) {
    const r = data[0];
    colonias.push({
      colonia: '',
      municipio: r.address?.city || r.address?.town || r.address?.municipality || '',
      estado: r.address?.state || '',
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      display: r.display_name,
    });
  }
  return colonias;
}

// ─── Componente Mapa ──────────────────────────────────────────────────────────
function MapaPicker({ lat, lng, colonias, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const initMap = useCallback(async () => {
    const Leaflet = await loadLeaflet();
    if (!Leaflet || !containerRef.current || mapRef.current) return;

    const centerLat = lat || (colonias[0]?.lat ?? 19.43);
    const centerLng = lng || (colonias[0]?.lon ?? -99.13);

    const map = Leaflet.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom: 14,
      zoomControl: true,
    });

    Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Marcadores de colonias
    colonias.forEach(c => {
      const popup = Leaflet.popup().setContent(
        `<b>${c.colonia || c.municipio}</b><br/>${c.municipio}, ${c.estado}<br/>
         <button onclick="window.dispatchEvent(new CustomEvent('selectColonia',{detail:${JSON.stringify(c)}}))"
           style="margin-top:6px;padding:4px 10px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer">
           Seleccionar
         </button>`
      );
      Leaflet.marker([c.lat, c.lon]).bindPopup(popup).addTo(map);
    });

    // Marcador de posición seleccionada
    if (lat && lng) {
      markerRef.current = Leaflet.marker([lat, lng], {
        icon: Leaflet.divIcon({
          html: '<div style="background:#ef4444;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          className: '',
        }),
        draggable: true,
      })
        .addTo(map)
        .bindPopup('📍 Ubicación seleccionada')
        .openPopup();

      markerRef.current.on('dragend', () => {
        const pos = markerRef.current.getLatLng();
        onSelect({ lat: pos.lat, lng: pos.lng });
      });
    }

    // Click en el mapa → colocar/mover marcador rojo
    map.on('click', e => {
      const { lat: clat, lng: clng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([clat, clng]);
      } else {
        markerRef.current = Leaflet.marker([clat, clng], {
          icon: Leaflet.divIcon({
            html: '<div style="background:#ef4444;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9],
            className: '',
          }),
          draggable: true,
        }).addTo(map);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current.getLatLng();
          onSelect({ lat: pos.lat, lng: pos.lng });
        });
      }
      onSelect({ lat: clat, lng: clng });
    });

    mapRef.current = map;
  }, []); // eslint-disable-line

  useEffect(() => {
    initMap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []); // eslint-disable-line

  // Escuchar evento de popup "Seleccionar"
  useEffect(() => {
    const handler = e => {
      const c = e.detail;
      onSelect({ lat: c.lat, lng: c.lon, colonia: c.colonia, municipio: c.municipio, estado: c.estado });
      if (mapRef.current) {
        mapRef.current.setView([c.lat, c.lon], 15);
        if (markerRef.current) {
          markerRef.current.setLatLng([c.lat, c.lon]);
        }
      }
    };
    window.addEventListener('selectColonia', handler);
    return () => window.removeEventListener('selectColonia', handler);
  }, [onSelect]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 320, borderRadius: 10, overflow: 'hidden', zIndex: 0 }}
    />
  );
}

// ─── Formulario con búsqueda CP ───────────────────────────────────────────────
const EMPTY = {
  nombre_tienda: '',
  calle: '',
  numero_exterior: '',
  colonia: '',
  municipio: '',
  estado: '',
  codigo_postal: '',
  telefono: '',
  latitud: null,
  longitud: null,
  activa: true,
};

const CAMPOS_TEXTO = [
  { label: 'Nombre de tienda *', key: 'nombre_tienda', full: true },
  { label: 'Calle', key: 'calle' },
  { label: 'Número exterior', key: 'numero_exterior' },
  { label: 'Colonia', key: 'colonia' },
  { label: 'Municipio', key: 'municipio' },
  { label: 'Estado', key: 'estado' },
  { label: 'Código postal', key: 'codigo_postal' },
  { label: 'Teléfono', key: 'telefono' },
];

function FormTienda({ form, setForm, modal }) {
  const [cpBuscando, setCpBuscando] = useState(false);
  const [colonias, setColonias] = useState([]);
  const [cpErr, setCpErr] = useState('');
  const [mapVisible, setMapVisible] = useState(!!(form.latitud && form.longitud));
  const timerRef = useRef(null);

  // Auto-buscar cuando cambia el código postal (debounce 800ms)
  useEffect(() => {
    const cp = form.codigo_postal?.trim();
    if (!cp || cp.length < 5) { setColonias([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setCpBuscando(true);
      setCpErr('');
      try {
        const res = await buscarColoniasPorCP(cp);
        setColonias(res);
        if (res.length > 0) setMapVisible(true);
        else setCpErr('No se encontraron colonias para ese C.P.');
      } catch {
        setCpErr('Error buscando el código postal');
      } finally {
        setCpBuscando(false);
      }
    }, 800);
    return () => clearTimeout(timerRef.current);
  }, [form.codigo_postal]);

  const seleccionarColonia = c => {
    setForm(f => ({
      ...f,
      colonia: c.colonia || f.colonia,
      municipio: c.municipio || f.municipio,
      estado: c.estado || f.estado,
      latitud: c.lat ?? f.latitud,
      longitud: c.lon ?? f.longitud,
    }));
  };

  const onMapSelect = useCallback(({ lat, lng, colonia, municipio, estado }) => {
    setForm(f => ({
      ...f,
      latitud: lat,
      longitud: lng,
      ...(colonia ? { colonia } : {}),
      ...(municipio ? { municipio } : {}),
      ...(estado ? { estado } : {}),
    }));
  }, [setForm]);

  return (
    <div style={fs.grid}>
      {CAMPOS_TEXTO.map(f => (
        <div key={f.key} style={f.full ? { gridColumn: '1 / -1' } : {}}>
          <label style={fs.label}>{f.label}</label>
          <input
            style={fs.input}
            value={form[f.key] || ''}
            placeholder={f.key === 'codigo_postal' ? '5 dígitos...' : ''}
            onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))}
          />
          {f.key === 'codigo_postal' && (
            <div style={{ marginTop: 4, fontSize: 11, color: '#64748b' }}>
              {cpBuscando && '🔍 Buscando colonias...'}
              {cpErr && <span style={{ color: '#ef4444' }}>{cpErr}</span>}
            </div>
          )}
        </div>
      ))}

      {/* Lista de colonias encontradas */}
      {colonias.length > 0 && (
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={fs.label}>Colonias encontradas — selecciona o elige en el mapa</label>
          <div style={fs.coloniasWrap}>
            {colonias.map((c, i) => (
              <button
                key={i}
                type="button"
                style={{
                  ...fs.coloniaBtn,
                  ...(form.colonia === c.colonia ? fs.coloniaBtnActive : {}),
                }}
                onClick={() => seleccionarColonia(c)}
              >
                {c.colonia || c.municipio}
                <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>
                  {c.municipio}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mapa */}
      {mapVisible && (
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={fs.label}>
            📍 Haz clic en el mapa para fijar la ubicación exacta
            {form.latitud && (
              <span style={{ color: '#16a34a', marginLeft: 8 }}>
                ✓ ({Number(form.latitud).toFixed(5)}, {Number(form.longitud).toFixed(5)})
              </span>
            )}
          </label>
          <MapaPicker
            lat={form.latitud}
            lng={form.longitud}
            colonias={colonias}
            onSelect={onMapSelect}
          />
        </div>
      )}

      {!mapVisible && colonias.length === 0 && form.codigo_postal?.length >= 5 && !cpBuscando && (
        <div style={{ gridColumn: '1 / -1', fontSize: 12, color: '#64748b' }}>
          📍 Ingresa un código postal válido para ver el mapa
        </div>
      )}

      {modal === 'editar' && (
        <div style={fs.checkRow}>
          <input
            type="checkbox"
            id="activa"
            checked={!!form.activa}
            onChange={e => setForm(fm => ({ ...fm, activa: e.target.checked }))}
          />
          <label htmlFor="activa" style={fs.label}>Tienda activa</label>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Tiendas() {
  const [tiendas, setTiendas] = useState([]);
  const [modal, setModal] = useState(null); // null | 'nuevo' | 'editar'
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null); // tienda a eliminar

  const cargar = () => {
    setLoading(true);
    getTiendas()
      .then(r => setTiendas(Array.isArray(r.data) ? r.data : []))
      .catch(() => setTiendas([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const abrir = (t = null) => {
    setForm(t ? { ...t } : EMPTY);
    setModal(t ? 'editar' : 'nuevo');
  };

  const cerrar = () => setModal(null);

  const guardar = async () => {
    if (!form.nombre_tienda?.trim()) return alert('Nombre de tienda requerido');
    setSaving(true);
    try {
      if (modal === 'nuevo') await createTienda(form);
      else await updateTienda(form.id_tienda, form);
      cerrar();
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const confirmarEliminar = t => setConfirmDel(t);

  const eliminar = async () => {
    if (!confirmDel) return;
    try {
      await deleteTienda(confirmDel.id_tienda);
      setConfirmDel(null);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>
        <h1 style={s.pageTitle}>🏪 Tiendas</h1>
        <button style={s.addBtn} onClick={() => abrir()}>+ Nueva tienda</button>
      </div>

      {/* GRID DE TIENDAS */}
      {loading ? (
        <p style={s.loading}>Cargando...</p>
      ) : tiendas.length === 0 ? (
        <p style={s.loading}>No hay tiendas registradas.</p>
      ) : (
        <div style={s.grid}>
          {tiendas.map(t => (
            <div key={t.id_tienda} style={s.card}>
              <div style={s.cardHead}>
                <span style={{ fontSize: 28 }}>🏪</span>
                <div style={{ flex: 1 }}>
                  <div style={s.tiendaNombre}>{t.nombre_tienda}</div>
                  <span style={{ ...s.badge, ...(t.activa ? s.badgeActiva : s.badgeInactiva) }}>
                    {t.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>

              <div style={s.dir}>
                {[t.calle, t.numero_exterior, t.colonia].filter(Boolean).join(', ')}
              </div>
              <div style={s.dir}>
                {[t.municipio, t.estado, t.codigo_postal].filter(Boolean).join(', ')}
              </div>
              {t.telefono && <div style={s.tel}>📞 {t.telefono}</div>}
              {t.latitud && t.longitud && (
                <div style={s.coords}>
                  📍 {Number(t.latitud).toFixed(4)}, {Number(t.longitud).toFixed(4)}
                </div>
              )}

              <div style={s.cardActions}>
                <button style={s.editBtn} onClick={() => abrir(t)}>✏️ Editar</button>
                <button style={s.delBtn} onClick={() => confirmarEliminar(t)}>🗑️ Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL NUEVO / EDITAR */}
      {modal && (
        <div style={s.overlay} onClick={cerrar}>
          <div style={s.modalCard} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>{modal === 'nuevo' ? '+ Nueva tienda' : '✏️ Editar tienda'}</h2>
              <button style={s.closeBtn} onClick={cerrar}>✕</button>
            </div>

            <div style={s.modalBody}>
              <FormTienda form={form} setForm={setForm} modal={modal} />
            </div>

            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={cerrar}>Cancelar</button>
              <button style={s.saveBtn} onClick={guardar} disabled={saving}>
                {saving ? 'Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINAR */}
      {confirmDel && (
        <div style={s.overlay} onClick={() => setConfirmDel(null)}>
          <div style={{ ...s.modalCard, maxWidth: 380, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>🗑️ Eliminar tienda</h2>
              <button style={s.closeBtn} onClick={() => setConfirmDel(null)}>✕</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p>¿Estás seguro de eliminar la tienda <strong>{confirmDel.nombre_tienda}</strong>?</p>
              <p style={{ fontSize: 13, color: '#ef4444', marginTop: 8 }}>Esta acción no se puede deshacer.</p>
            </div>
            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => setConfirmDel(null)}>Cancelar</button>
              <button
                style={{ ...s.saveBtn, background: '#ef4444' }}
                onClick={eliminar}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = {
  page: { padding: '12px 16px', maxWidth: 1200, margin: '0 auto' },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  pageTitle: { fontSize: 'clamp(18px,4vw,26px)', fontWeight: 800, margin: 0 },
  addBtn: {
    padding: '10px 18px',
    background: '#2563eb',
    color: '#fff',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    whiteSpace: 'nowrap',
  },

  loading: { textAlign: 'center', color: '#64748b', marginTop: 40 },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,260px), 1fr))',
    gap: 16,
  },

  card: {
    background: '#fff',
    padding: 16,
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  cardHead: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  tiendaNombre: { fontWeight: 700, fontSize: 15, wordBreak: 'break-word' },

  badge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, display: 'inline-block' },
  badgeActiva: { background: '#dcfce7', color: '#16a34a' },
  badgeInactiva: { background: '#fee2e2', color: '#dc2626' },

  dir: { fontSize: 12, color: '#64748b', wordBreak: 'break-word' },
  tel: { fontSize: 12, color: '#334155' },
  coords: { fontSize: 11, color: '#94a3b8' },

  cardActions: { display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  editBtn: {
    flex: 1,
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #2563eb',
    color: '#2563eb',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  delBtn: {
    flex: 1,
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #ef4444',
    color: '#ef4444',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.45)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 16,
  },
  modalCard: {
    background: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 620,
    maxHeight: '95dvh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,.25)',
  },
  modalHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  modalTitle: { fontSize: 18, fontWeight: 700, margin: 0 },
  closeBtn: {
    border: 'none',
    background: 'none',
    fontSize: 18,
    cursor: 'pointer',
    color: '#94a3b8',
    lineHeight: 1,
    padding: 4,
  },
  modalBody: { padding: '16px 20px', overflowY: 'auto', flex: 1 },
  modalFooter: {
    padding: '14px 20px',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    gap: 10,
    flexShrink: 0,
  },
  cancelBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
  },
  saveBtn: {
    flex: 2,
    padding: 10,
    borderRadius: 8,
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 14,
  },
};

const fs = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%,220px), 1fr))',
    gap: '10px 14px',
  },
  label: { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 },
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
  },
  coloniasWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    maxHeight: 130,
    overflowY: 'auto',
    padding: 4,
  },
  coloniaBtn: {
    padding: '6px 12px',
    borderRadius: 20,
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    cursor: 'pointer',
    fontSize: 13,
    textAlign: 'left',
    transition: 'background .15s',
  },
  coloniaBtnActive: {
    background: '#dbeafe',
    border: '1.5px solid #2563eb',
    color: '#1d4ed8',
    fontWeight: 600,
  },
  checkRow: { gridColumn: '1 / -1', display: 'flex', gap: 8, alignItems: 'center' },
};
