import { useEffect, useState } from 'react';
import { getEmpleados, createEmpleado, updateEmpleado, getTiendas } from '../services/api';

const EMPTY = { rfc_empleado: '', nombre: '', apellido_paterno: '', apellido_materno: '', puesto: '', correo_electronico: '', id_tienda: '', activo: true, contrasena_inicial: '' };

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const cargar = () => {
    setLoading(true);
    getEmpleados({ activo: true }).then(r => setEmpleados(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
    getTiendas().then(r => setTiendas(r.data));
  }, []);

  const abrir = (emp = null) => {
    setForm(emp ? { ...emp } : EMPTY);
    setModal(emp ? 'editar' : 'nuevo');
  };

  const guardar = async () => {
    setSaving(true);
    try {
      if (modal === 'nuevo') {
        const res = await createEmpleado(form);
        const creado = res.data;
        const claveUsada = creado.contrasena_inicial || form.rfc_empleado.toUpperCase();
        alert(`✅ Empleado registrado correctamente.\n\n🔑 Contraseña de acceso: ${claveUsada}\n\nEl empleado puede iniciar sesión con su RFC y esta contraseña.`);
      } else {
        await updateEmpleado(form.rfc_empleado, form);
      }
      setModal(null);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const filtrados = empleados.filter(e =>
    search === '' ||
    e.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    e.apellido_paterno?.toLowerCase().includes(search.toLowerCase()) ||
    e.rfc_empleado?.includes(search.toUpperCase())
  );

  const initials = (e) => `${e.nombre?.[0] || ''}${e.apellido_paterno?.[0] || ''}`;
  const PUESTOS = ['Gerente', 'Cajero', 'Almacenista', 'Vendedor', 'Administrador'];

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.pageTitle}>👥 Empleados</h1>
        <button style={s.addBtn} onClick={() => abrir()}>+ Nuevo empleado</button>
      </div>

      <input style={s.searchInput} placeholder="🔍 Buscar por nombre o RFC..."
        value={search} onChange={e => setSearch(e.target.value)} />

      {loading ? <p style={s.loading}>Cargando...</p> : (
        <div style={s.grid}>
          {filtrados.map(emp => (
            <div key={emp.rfc_empleado} style={s.card}>
              <div style={s.avatar}>{initials(emp)}</div>
              <div style={s.empNombre}>{emp.nombre} {emp.apellido_paterno} {emp.apellido_materno}</div>
              <div style={s.empPuesto}>{emp.puesto}</div>
              <div style={s.empRfc}>{emp.rfc_empleado}</div>
              {emp.correo_electronico && <div style={s.empCorreo}>{emp.correo_electronico}</div>}
              <div style={s.empTienda}>📍 {emp.tiendas?.nombre_tienda || 'Sin tienda'}</div>
              <button style={s.editBtn} onClick={() => abrir(emp)}>Editar</button>
            </div>
          ))}
          {filtrados.length === 0 && <p style={s.loading}>Sin resultados.</p>}
        </div>
      )}

      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modalCard} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitle}>{modal === 'nuevo' ? 'Nuevo empleado' : 'Editar empleado'}</h2>
            <div style={s.formGrid}>
              {[
                { label: 'RFC', key: 'rfc_empleado', disabled: modal === 'editar' },
                { label: 'Nombre', key: 'nombre' },
                { label: 'Apellido paterno', key: 'apellido_paterno' },
                { label: 'Apellido materno', key: 'apellido_materno' },
                { label: 'Correo', key: 'correo_electronico' },
              ].map(f => (
                <div key={f.key}>
                  <label style={s.label}>{f.label}</label>
                  <input style={{ ...s.input, background: f.disabled ? '#f1f5f9' : '' }}
                    value={form[f.key] || ''} disabled={f.disabled}
                    onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} />
                </div>
              ))}

              {/* Campo contraseña solo al crear */}
              {modal === 'nuevo' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={s.label}>🔑 Contraseña inicial de acceso</label>
                  <input
                    style={s.input}
                    type="text"
                    placeholder="Dejar vacío para usar el RFC como contraseña"
                    value={form.contrasena_inicial || ''}
                    onChange={e => setForm(fm => ({ ...fm, contrasena_inicial: e.target.value }))}
                  />
                  <p style={s.hint}>
                    Si no escribes una contraseña, se usará el RFC del empleado como contraseña por defecto.
                  </p>
                </div>
              )}
              <div>
                <label style={s.label}>Puesto</label>
                <select style={s.input} value={form.puesto || ''}
                  onChange={e => setForm(fm => ({ ...fm, puesto: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {PUESTOS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Tienda</label>
                <select style={s.input} value={form.id_tienda || ''}
                  onChange={e => setForm(fm => ({ ...fm, id_tienda: e.target.value }))}>
                  <option value="">Sin tienda</option>
                  {tiendas.map(t => <option key={t.id_tienda} value={t.id_tienda}>{t.nombre_tienda}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button style={s.cancelBtn} onClick={() => setModal(null)}>Cancelar</button>
              <button style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }} onClick={guardar} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pageTitle: { margin: 0, fontSize: 26, fontWeight: 800, color: '#1e293b' },
  addBtn: { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  searchInput: { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, marginBottom: 16, boxSizing: 'border-box' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 },
  card: { background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 8px rgba(0,0,0,.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' },
  avatar: { width: 52, height: 52, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 },
  empNombre: { fontWeight: 700, fontSize: 14, color: '#1e293b' },
  empPuesto: { background: '#dbeafe', color: '#2563eb', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 },
  empRfc: { fontSize: 12, fontFamily: 'monospace', color: '#64748b' },
  empCorreo: { fontSize: 11, color: '#94a3b8' },
  empTienda: { fontSize: 12, color: '#475569' },
  editBtn: { marginTop: 4, padding: '6px 16px', borderRadius: 7, background: '#f1f5f9', border: '1.5px solid #e2e8f0', cursor: 'pointer', fontWeight: 600, fontSize: 12 },
  hint: { fontSize: 11, color: '#94a3b8', margin: '4px 0 0', fontStyle: 'italic' },
  loading: { textAlign: 'center', padding: 32, color: '#94a3b8' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modalCard: { background: '#fff', borderRadius: 16, padding: 28, width: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 48px rgba(0,0,0,.18)' },
  modalTitle: { margin: '0 0 16px', fontSize: 18, fontWeight: 800 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  label: { fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 },
  input: { padding: '9px 10px', borderRadius: 7, border: '1.5px solid #e2e8f0', fontSize: 13, width: '100%', boxSizing: 'border-box' },
  cancelBtn: { flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 },
  saveBtn: { flex: 2, padding: '10px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }
};
