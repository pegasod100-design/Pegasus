import { useEffect, useState } from 'react';
import { getEmpleados, createEmpleado, updateEmpleado, getTiendas } from '../services/api';
import api from '../services/api';

const css = `
  .emp-header{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px;}
  .emp-title{margin:0;font-size:clamp(18px,4vw,26px);font-weight:800;color:#1e293b;}
  .emp-add-btn{padding:10px 18px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;white-space:nowrap;}
  .emp-search{width:100%;padding:10px 14px;border-radius:8px;border:1.5px solid #e2e8f0;font-size:14px;margin-bottom:16px;box-sizing:border-box;}
  .emp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,180px),1fr));gap:12px;}
  .emp-card{background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 8px rgba(0,0,0,.07);display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;}
  .emp-avatar{width:48px;height:48px;border-radius:50%;background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;}
  .emp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center;z-index:300;padding:0;}
  @media(min-width:600px){.emp-overlay{align-items:center;padding:16px;}}
  .emp-modal{background:#fff;border-radius:16px 16px 0 0;padding:24px 20px;width:100%;max-height:92dvh;overflow-y:auto;box-shadow:0 -4px 32px rgba(0,0,0,.2);}
  @media(min-width:600px){.emp-modal{border-radius:16px;max-width:500px;max-height:90vh;}}
  .emp-form-grid{display:grid;grid-template-columns:1fr;gap:12px;}
  @media(min-width:480px){.emp-form-grid{grid-template-columns:1fr 1fr;}}
  .del-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:400;padding:16px;}
  .del-card{background:#fff;border-radius:14px;padding:28px;max-width:360px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.25);display:flex;flex-direction:column;gap:14px;}
`;

const EMPTY = { rfc_empleado:'', nombre:'', apellido_paterno:'', apellido_materno:'', puesto:'', correo_electronico:'', id_tienda:'', activo:true };
const PUESTOS = ['Gerente','Cajero','Almacenista','Vendedor','Administrador'];
const inp = { padding:'9px 10px', borderRadius:7, border:'1.5px solid #e2e8f0', fontSize:13, width:'100%', boxSizing:'border-box' };
const lbl = { fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:4 };

export default function Empleados() {
  const [empleados, setEmpleados]           = useState([]);
  const [tiendas, setTiendas]               = useState([]);
  const [search, setSearch]                 = useState('');
  const [modal, setModal]                   = useState(null);
  const [form, setForm]                     = useState(EMPTY);
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [reenviar, setReenviar]             = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [eliminando, setEliminando]         = useState(false);

  const cargar = () => {
    setLoading(true);
    getEmpleados({ activo: true }).then(r => setEmpleados(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); getTiendas().then(r => setTiendas(r.data || [])); }, []);

  const abrir = (emp = null) => {
    setForm(emp ? { ...emp } : EMPTY);
    setReenviar(false);
    setModal(emp ? 'editar' : 'nuevo');
  };

  const guardar = async () => {
    setSaving(true);
    try {
      if (modal === 'nuevo') {
        const res = await createEmpleado(form);
        const msg = res.data?.email_enviado
          ? `\n📧 Email enviado a ${form.correo_electronico} con enlace para establecer contraseña.`
          : '\n⚠️ Sin correo — el empleado no recibirá email.';
        alert(`✅ Empleado creado.${msg}`);
      } else {
        const res = await updateEmpleado(form.rfc_empleado, { ...form, reenviar_link: reenviar });
        if (reenviar) {
          alert(`✅ Empleado actualizado.\n${res.data?.email_enviado ? '📧 Enlace reenviado.' : '⚠️ No se pudo enviar email.'}`);
        } else {
          alert('✅ Empleado actualizado.');
        }
      }
      setModal(null);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar');
    } finally { setSaving(false); }
  };

  // HARD DELETE — elimina de inicio_sesion Y catalogo_empleados
  const eliminarEmpleado = async () => {
    if (!confirmarEliminar) return;
    setEliminando(true);
    try {
      await api.delete(`/api/empleados/${confirmarEliminar.rfc_empleado}`);
      setConfirmarEliminar(null);
      cargar();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    } finally { setEliminando(false); }
  };

  const filtrados = empleados.filter(e =>
    search === '' ||
    e.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    e.apellido_paterno?.toLowerCase().includes(search.toLowerCase()) ||
    e.rfc_empleado?.includes(search.toUpperCase())
  );

  const initials = e => `${e.nombre?.[0]||''}${e.apellido_paterno?.[0]||''}`;

  return (
    <>
      <style>{css}</style>
      <div>
        <div className="emp-header">
          <h1 className="emp-title">👥 Empleados</h1>
          <button className="emp-add-btn" onClick={() => abrir()}>+ Nuevo empleado</button>
        </div>

        <input className="emp-search" placeholder="🔍 Buscar por nombre o RFC..."
          value={search} onChange={e => setSearch(e.target.value)} />

        {loading
          ? <p style={{ textAlign:'center', color:'#94a3b8', padding:32 }}>Cargando...</p>
          : (
            <div className="emp-grid">
              {filtrados.map(emp => (
                <div key={emp.rfc_empleado} className="emp-card">
                  <div className="emp-avatar">{initials(emp)}</div>
                  <div style={{ fontWeight:700, fontSize:13, color:'#1e293b' }}>{emp.nombre} {emp.apellido_paterno}</div>
                  <div style={{ background:'#dbeafe', color:'#2563eb', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>{emp.puesto}</div>
                  <div style={{ fontSize:11, fontFamily:'monospace', color:'#64748b' }}>{emp.rfc_empleado}</div>
                  {emp.correo_electronico && <div style={{ fontSize:11, color:'#94a3b8', wordBreak:'break-all' }}>{emp.correo_electronico}</div>}
                  <div style={{ fontSize:12, color:'#475569' }}>📍 {emp.tiendas?.nombre_tienda || 'Sin tienda'}</div>
                  <div style={{ display:'flex', gap:6, marginTop:4, width:'100%' }}>
                    <button style={{ flex:1, padding:'6px 10px', borderRadius:7, background:'#f1f5f9', border:'1.5px solid #e2e8f0', cursor:'pointer', fontWeight:600, fontSize:12 }}
                      onClick={() => abrir(emp)}>✏️ Editar</button>
                    <button style={{ padding:'6px 10px', borderRadius:7, background:'#fee2e2', border:'1.5px solid #fecaca', cursor:'pointer', fontWeight:700, fontSize:12, color:'#dc2626' }}
                      onClick={() => setConfirmarEliminar(emp)}>🗑️</button>
                  </div>
                </div>
              ))}
              {filtrados.length === 0 && <p style={{ color:'#94a3b8', gridColumn:'1/-1', textAlign:'center', padding:24 }}>Sin resultados.</p>}
            </div>
          )
        }

        {/* ── MODAL CREAR / EDITAR ── */}
        {modal && (
          <div className="emp-overlay" onClick={() => setModal(null)}>
            <div className="emp-modal" onClick={e => e.stopPropagation()}>
              <h2 style={{ margin:'0 0 16px', fontSize:18, fontWeight:800 }}>
                {modal === 'nuevo' ? '+ Nuevo empleado' : '✏️ Editar empleado'}
              </h2>
              <div className="emp-form-grid">
                {[
                  { label:'RFC', key:'rfc_empleado', disabled: modal === 'editar' },
                  { label:'Nombre', key:'nombre' },
                  { label:'Apellido paterno', key:'apellido_paterno' },
                  { label:'Apellido materno', key:'apellido_materno' },
                  { label:'Correo electrónico', key:'correo_electronico' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={lbl}>{f.label}</label>
                    <input style={{ ...inp, background: f.disabled ? '#f1f5f9' : '' }}
                      value={form[f.key] || ''} disabled={f.disabled}
                      onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label style={lbl}>Puesto</label>
                  <select style={inp} value={form.puesto || ''} onChange={e => setForm(fm => ({ ...fm, puesto: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {PUESTOS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Tienda asignada</label>
                  <select style={inp} value={form.id_tienda || ''} onChange={e => setForm(fm => ({ ...fm, id_tienda: e.target.value }))}>
                    <option value="">Sin tienda</option>
                    {tiendas.map(t => <option key={t.id_tienda} value={t.id_tienda}>{t.nombre_tienda}</option>)}
                  </select>
                </div>
              </div>

              {modal === 'nuevo' && (
                <div style={{ marginTop:14, background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#1d4ed8' }}>
                  📧 Al guardar se enviará un enlace al correo del empleado para que establezca su contraseña.
                </div>
              )}
              {modal === 'editar' && (
                <div style={{ marginTop:14 }}>
                  <button onClick={() => setReenviar(v => !v)}
                    style={{ width:'100%', padding:'8px 14px', background: reenviar ? '#dcfce7' : '#f0fdf4', border:`1.5px solid ${reenviar ? '#4ade80' : '#86efac'}`, borderRadius:7, color:'#15803d', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                    {reenviar ? '✅ Se reenviará el enlace al guardar' : '📧 Reenviar enlace para establecer contraseña'}
                  </button>
                </div>
              )}

              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button style={{ flex:1, padding:10, borderRadius:8, border:'1.5px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontWeight:600 }}
                  onClick={() => setModal(null)}>Cancelar</button>
                <button style={{ flex:2, padding:10, borderRadius:8, background:'#2563eb', color:'#fff', border:'none', cursor:'pointer', fontWeight:700, opacity: saving ? 0.7 : 1 }}
                  onClick={guardar} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL CONFIRMAR ELIMINAR ── */}
        {confirmarEliminar && (
          <div className="del-overlay" onClick={() => setConfirmarEliminar(null)}>
            <div className="del-card" onClick={e => e.stopPropagation()}>
              <div style={{ textAlign:'center' }}>
                <span style={{ fontSize:44 }}>🗑️</span>
                <h3 style={{ margin:'8px 0 4px', fontSize:18, fontWeight:800, color:'#1e293b' }}>¿Eliminar empleado?</h3>
                <p style={{ margin:0, fontSize:14, color:'#64748b' }}><strong>{confirmarEliminar.nombre} {confirmarEliminar.apellido_paterno}</strong></p>
                <p style={{ margin:'4px 0 0', fontSize:12, fontFamily:'monospace', color:'#94a3b8' }}>{confirmarEliminar.rfc_empleado}</p>
              </div>
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px' }}>
                <p style={{ margin:0, fontSize:12, color:'#dc2626' }}>
                  ⚠️ Esta acción es <strong>permanente</strong>. El empleado y sus datos de acceso serán eliminados por completo de la base de datos.
                </p>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button style={{ flex:1, padding:'11px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontWeight:600, fontSize:14 }}
                  onClick={() => setConfirmarEliminar(null)}>Cancelar</button>
                <button style={{ flex:1, padding:'11px', borderRadius:8, background:'#dc2626', color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:14, opacity: eliminando ? 0.7 : 1 }}
                  onClick={eliminarEmpleado} disabled={eliminando}>
                  {eliminando ? 'Eliminando...' : '🗑️ Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
