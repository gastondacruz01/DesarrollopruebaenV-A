import React from 'react';

export default function DeleteConfirm({ cliente, onConfirm, onCancel, loading }) {
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="confirm-box">
        <div className="icon">⚠️</div>
        <h3>Dar de baja cliente</h3>
        <p>
          ¿Confirmás la baja de <strong>{cliente?.razon_social}</strong>?<br />
          El registro pasará a estado <em>Inactivo</em> (baja lógica).
        </p>
        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? '⏳ Procesando...' : '🗑️ Confirmar Baja'}
          </button>
        </div>
      </div>
    </div>
  );
}
