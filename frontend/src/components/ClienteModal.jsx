import React, { useState, useEffect } from 'react';

const EMPTY = {
  razon_social: '', cuit: '', tipo_persona: 'FISICA', segmento: 'RETAIL',
  estado: 'ACTIVO', email: '', telefono: '', direccion: '',
  localidad: '', provincia: '', codigo_postal: '', observaciones: '',
};

const PROVINCIAS = [
  'CABA','Buenos Aires','Catamarca','Chaco','Chubut','Córdoba','Corrientes',
  'Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones',
  'Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe',
  'Santiago del Estero','Tierra del Fuego','Tucumán',
];

export default function ClienteModal({ cliente, onClose, onSave, loading }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(cliente ? { ...EMPTY, ...cliente } : EMPTY);
    setErrors({});
  }, [cliente]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.razon_social.trim()) e.razon_social = 'Requerido';
    if (!form.cuit.trim()) e.cuit = 'Requerido';
    // ⚠️ GAP — US-1591272
    // Escenario: "El CUIT debe tener formato válido (11 dígitos numéricos)"
    // Problema: El CA dice '11 dígitos numéricos' pero la regex valida el formato con guiones (XX-XXXXXXXX-X).
    //           Un CUIT como '30712345678' (sin guiones) es rechazado aunque sea numéricamente válido.
    // Sugerencia: Aclarar con el PO el formato de entrada. Si se acepta sin guiones: /^\d{11}$/
    else if (!/^\d{2}-\d{7,8}-\d$/.test(form.cuit)) e.cuit = 'Formato inválido: XX-XXXXXXXX-X';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  };

  const F = ({ id, label, req, type = 'text', children, full }) => (
    <div className={`form-group${full ? ' full-width' : ''}`}>
      <label htmlFor={id}>{label}{req && <span className="required">*</span>}</label>
      {children || (
        <input id={id} className={`form-control${errors[id] ? ' error' : ''}`}
          type={type} value={form[id]} onChange={e => set(id, e.target.value)} />
      )}
      {errors[id] && <span className="error-msg">{errors[id]}</span>}
    </div>
  );

  const Sel = ({ id, label, req, opts }) => (
    <div className="form-group">
      <label htmlFor={id}>{label}{req && <span className="required">*</span>}</label>
      <select id={id} className="form-control" value={form[id]} onChange={e => set(id, e.target.value)}>
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );

  const isEdit = !!cliente?.id;

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isEdit ? '✏️ Modificar Cliente' : '➕ Nuevo Cliente'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <span className="section-label">Datos principales</span>
            <F id="razon_social" label="Razón Social / Nombre" req full />
            <F id="cuit" label="CUIT" req>
              <input id="cuit" className={`form-control${errors.cuit ? ' error' : ''}`}
                placeholder="20-12345678-9" value={form.cuit}
                onChange={e => set('cuit', e.target.value)} />
            </F>
            <Sel id="tipo_persona" label="Tipo de Persona" req opts={[
              { v: 'FISICA', l: 'Persona Física' }, { v: 'JURIDICA', l: 'Persona Jurídica' }
            ]} />
            <Sel id="segmento" label="Segmento" req opts={[
              { v: 'RETAIL', l: 'Retail' }, { v: 'PYME', l: 'PYME' },
              { v: 'CORPORATIVO', l: 'Corporativo' }, { v: 'PREMIUM', l: 'Premium' }
            ]} />
            {isEdit && (
              <Sel id="estado" label="Estado" req opts={[
                { v: 'ACTIVO', l: 'Activo' }, { v: 'INACTIVO', l: 'Inactivo' }, { v: 'BLOQUEADO', l: 'Bloqueado' }
              ]} />
            )}

            <span className="section-label">Contacto</span>
            <F id="email" label="Email" type="email" />
            <F id="telefono" label="Teléfono" />

            <span className="section-label">Domicilio</span>
            <F id="direccion" label="Dirección" full />
            <F id="localidad" label="Localidad" />
            <div className="form-group">
              <label htmlFor="provincia">Provincia</label>
              <select id="provincia" className="form-control" value={form.provincia} onChange={e => set('provincia', e.target.value)}>
                <option value="">Seleccionar...</option>
                {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <F id="codigo_postal" label="Código Postal" />

            <span className="section-label">Observaciones</span>
            <div className="form-group full-width">
              <label htmlFor="observaciones">Observaciones</label>
              <textarea id="observaciones" className="form-control" rows={3}
                value={form.observaciones} onChange={e => set('observaciones', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? '⏳ Guardando...' : isEdit ? '💾 Guardar Cambios' : '✅ Crear Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
}
