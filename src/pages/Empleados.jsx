import { useEffect, useState } from 'react';
import { getEmpleados, createEmpleado, updateEmpleado, getTiendas } from '../services/api';

const css = `
  .emp-header{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px;}
  .emp-title{margin:0;font-size:clamp(18px,4vw,26px);font-weight:800;color:#1e293b;}
  .emp-add-btn{padding:10px 18px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;white-space:nowrap;}
  .emp-search{width:100%;padding:10px 14px;border-radius:8px;border:1.5px solid #e2e8f0;font-size:14px;margin-bottom:16px;box-sizing:border-box;}
  .emp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,180px),1fr));gap:12px;}
  .emp-card{background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 8px rgba(0,0,0,.07);display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;}
  .emp-avatar{width:48px;height:48px;border-radius:50%;background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;}
  .emp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;z-index:300;padding:0;}
  @media(min-width:600px){.emp-overlay{align-items:center;padding:16px;}}
  .emp-modal{background:#fff;border-radius:16px 16px 0 0;padding:24px 20px;width:100%;max-height:92dvh;overflow-y:auto;box-shadow:0 -4px 32px rgba(0,0,0,.15);}
  @media(min-width:600px){.emp-modal{border-radius:16px;max-width:500px;max-height:90vh;}}
  .emp-form-grid{display:grid;grid-template-columns:1fr;gap:12px;}
  @media(min-width:480px){.emp-form-grid{grid-template-columns:1fr 1fr;}}
  .emp-hint{font-size:11px;color:#94a3b8;margin:4px 0 0;font-style:italic;}
  .emp-info-box{width:100%;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 14px;font-size:12px;color:#1d4ed8;box-sizing:border-box;}
  .btn-reenviar{padding:8px 14px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:7px;color:#15803d;font-size:12px;font-weight:700;cursor:pointer;width:100%;}
  .btn-reenviar:hover{background:#dcfce7;}
  .btn-reenviar:disabled{opacity:0.6;cursor:not-allowed;}
`;

const EMPTY = { rfc_empleado:'', nombre:'', apellido_paterno:'', apellido_materno:'', puesto:'', correo_electronico:'', id_tienda:'', activo:true };
const PUESTOS = ['Gerente','Cajero','Almacenista','Vendedor','Administrador'];
const inp = { padding:'9px 10px', borderRadius:7, border:'1.5px solid #e2e8f0', fontSize:13, width:'100%', boxSizing:'border-box' };
const lbl = { fontSize:12, fontWeight:600, color:'#475569', display:'block', marginBottom:4 };

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reenviar, setReenviar] = useState(false);

  const cargar = () => {
    setLoading(true);
    getEmpleados({ activo: true }).then(r => setEmpleados(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); getTiendas().then(r => setTiendas(r.data)); }, []);

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
        const emailMsg = res.data?.email_enviado
          ? `\n📧 Se envió un email a ${form.correo_electronico} con el enlace para establecer contraseña.`
          : '\n⚠️ Sin correo registrado — el empleado no recibirá email.';
        alert(`✅ Empleado creado.${emailMsg}`);
      } else {
        const payload = { ...form, reenviar_link: reenviar };
        const res = await updateEmpleado(form.rfc_empleado, payload);
        if (reenviar) {
          const emailMsg = res.data?.email_enviado
            ? `📧 Se reenvió el enlace a ${form.correo_electronico}.`
            : '⚠️ No se pudo enviar el email (sin correo o error).';
          alert(`✅ Empleado actualizado.\n${emailMsg}`);
        }
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

        {loading ? <p style={{ textAlign:'center', color:'#94a3b8', padding:32 }}>Cargando...</p> : (
          <div className="emp-grid">
            {filtrados.map(emp => (
              <div key={emp.rfc_empleado} className="emp-card">
                <div className="emp-avatar">{initials(emp)}</div>
                <div style={{ fontWeight:700, fontSize:13, color:'#1e293b' }}>{emp.nombre} {emp.apellido_paterno}</div>
                <div style={{ background:'#dbeafe', color:'#2563eb', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>{emp.puesto}</div>
                <div style={{ fontSize:11, fontFamily:'monospace', color:'#64748b' }}>{emp.rfc_empleado}</div>
                {emp.correo_electronico && <div style={{ fontSize:11, color:'#94a3b8' }}>{emp.correo_electronico}</div>}
                <div style={{ fontSize:12, color:'#475569' }}>📍 {emp.tiendas?.nombre_tienda || 'Sin tienda'}</div>
                <button style={{ marginTop:4, padding:'6px 16px', borderRadius:7, background:'#f1f5f9', border:'1.5px solid #e2e8f0', cursor:'pointer', fontWeight:600, fontSize:12 }}
                  onClick={() => abrir(emp)}>Editar</button>
              </div>
            ))}
            {filtrados.length === 0 && <p style={{ color:'#94a3b8', gridColumn:'1/-1', textAlign:'center', padding:24 }}>Sin resultados.</p>}
          </div>
        )}

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
                  <select style={inp} value={form.puesto || ''}
                    onChange={e => setForm(fm => ({ ...fm, puesto: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {PUESTOS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label style={lbl}>Tienda asignada</label>
                  <select style={inp} value={form.id_tienda || ''}
                    onChange={e => setForm(fm => ({ ...fm, id_tienda: e.target.value }))}>
                    <option value="">Sin tienda</option>
                    {tiendas.map(t => <option key={t.id_tienda} value={t.id_tienda}>{t.nombre_tienda}</option>)}
                  </select>
                </div>
              </div>

              {/* Info sobre contraseñas */}
              {modal === 'nuevo' && (
                <div className="emp-info-box" style={{ marginTop:14 }}>
                  📧 Al guardar, se enviará automáticamente un email al empleado con un <strong>enlace para establecer su contraseña</strong>. El empleado NO recibirá la contraseña directamente.
                </div>
              )}

              {modal === 'editar' && (
                <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
                  <button
                    className="btn-reenviar"
                    onClick={() => setReenviar(v => !v)}
                    style={{ background: reenviar ? '#dcfce7' : '#f0fdf4', borderColor: reenviar ? '#4ade80' : '#86efac' }}>
                    {reenviar ? '✅ Se reenviará el link al guardar' : '📧 Reenviar link de establecer contraseña'}
                  </button>
                  {reenviar && (
                    <p className="emp-hint" style={{ color:'#15803d' }}>
                      Al guardar, se enviará un nuevo enlace (válido 24 h) al correo del empleado para que establezca su contraseña.
                    </p>
                  )}
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
      </div>
    </>
  );
}
