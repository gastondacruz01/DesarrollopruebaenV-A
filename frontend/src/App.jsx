import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import ClienteModal from './components/ClienteModal';
import DeleteConfirm from './components/DeleteConfirm';

// ── Toast ─────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' ? '✅' : '❌'} {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Badges ────────────────────────────────────────────────────────────────
const BadgeEstado = ({ v }) => (
  <span className={`badge badge-${v?.toLowerCase()}`}>{v}</span>
);
const BadgeSegmento = ({ v }) => (
  <span className={`badge badge-${v?.toLowerCase()}`}>{v}</span>
);

// ── App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [clientes, setClientes]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [filters, setFilters]       = useState({ busqueda: '', segmento: '', estado: '', tipo_persona: '' });
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [modal, setModal]           = useState(null);   // null | 'create' | 'edit'
  const [selected, setSelected]     = useState(null);   // cliente actual
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toasts, setToasts]         = useState([]);

  const toast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  const fetchClientes = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.list({ ...filters, page, limit: pagination.limit });
      setClientes(res.data);
      setPagination(res.pagination);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => { fetchClientes(1); }, [filters]);

  // ── CRUD handlers ────────────────────────────────────────────────────────

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (modal === 'edit') {
        await api.update(selected.id, form);
        toast('Cliente actualizado correctamente');
      } else {
        await api.create(form);
        toast('Cliente creado correctamente');
      }
      setModal(null);
      fetchClientes(pagination.page);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await api.delete(deleteTarget.id);
      toast(res.message);
      setDeleteTarget(null);
      fetchClientes(pagination.page);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Filter helpers ────────────────────────────────────────────────────────

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <span className="header-title">🏦 ABM Clientes</span>
        <span style={{ fontSize: 12, opacity: .7 }}>{pagination.total} clientes en total</span>
      </header>

      <main className="main">
        <div className="card">
          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                placeholder="Buscar por razón social, CUIT o email..."
                value={filters.busqueda}
                onChange={e => setFilter('busqueda', e.target.value)}
              />
            </div>
            <select className="filter-select" value={filters.segmento} onChange={e => setFilter('segmento', e.target.value)}>
              <option value="">Todos los segmentos</option>
              {['RETAIL','PYME','CORPORATIVO','PREMIUM'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="filter-select" value={filters.estado} onChange={e => setFilter('estado', e.target.value)}>
              <option value="">Todos los estados</option>
              {['ACTIVO','INACTIVO','BLOQUEADO'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="filter-select" value={filters.tipo_persona} onChange={e => setFilter('tipo_persona', e.target.value)}>
              <option value="">Tipo de persona</option>
              <option value="FISICA">Física</option>
              <option value="JURIDICA">Jurídica</option>
            </select>
            <button className="btn btn-primary" onClick={() => { setSelected(null); setModal('create'); }}>
              ➕ Nuevo Cliente
            </button>
          </div>

          {/* Table */}
          <div className="table-wrap">
            {loading ? (
              <div className="empty-state"><div className="icon">⏳</div><p>Cargando clientes...</p></div>
            ) : clientes.length === 0 ? (
              <div className="empty-state"><div className="icon">📂</div><p>No se encontraron clientes</p></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Razón Social</th>
                    <th>CUIT</th>
                    <th>Tipo</th>
                    <th>Segmento</th>
                    <th>Estado</th>
                    <th>Email</th>
                    <th>Localidad</th>
                    <th>Alta</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map(c => (
                    <tr key={c.id}>
                      <td style={{ color: 'var(--gray-400)', fontFamily: 'monospace' }}>{c.id}</td>
                      <td><strong>{c.razon_social}</strong></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{c.cuit}</td>
                      <td>{c.tipo_persona === 'FISICA' ? 'Física' : 'Jurídica'}</td>
                      <td><BadgeSegmento v={c.segmento} /></td>
                      <td><BadgeEstado v={c.estado} /></td>
                      <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{c.email || '—'}</td>
                      <td>{c.localidad || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>{c.fecha_alta}</td>
                      <td>
                        <div className="actions-cell">
                          <button className="btn btn-ghost btn-icon" title="Editar"
                            onClick={() => { setSelected(c); setModal('edit'); }}>✏️</button>
                          <button className="btn btn-ghost btn-icon" title="Dar de baja"
                            disabled={c.estado === 'INACTIVO'}
                            onClick={() => setDeleteTarget(c)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="pagination">
            <span className="pagination-info">
              Mostrando {clientes.length} de {pagination.total} registros
            </span>
            <div className="pagination-controls">
              <button className="btn btn-ghost btn-icon"
                disabled={pagination.page <= 1}
                onClick={() => fetchClientes(pagination.page - 1)}>◀</button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p}
                  className={`btn ${p === pagination.page ? 'btn-primary' : 'btn-ghost'} btn-icon`}
                  onClick={() => fetchClientes(p)}>{p}</button>
              ))}
              <button className="btn btn-ghost btn-icon"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchClientes(pagination.page + 1)}>▶</button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {modal && (
        <ClienteModal
          cliente={modal === 'edit' ? selected : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
          loading={saving}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          cliente={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={saving}
        />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
