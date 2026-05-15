const BASE = '/api/clientes';

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.errors?.[0]?.msg || 'Error en la solicitud');
  return data;
}

export const api = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined))
    ).toString();
    return request(`${BASE}${qs ? '?' + qs : ''}`);
  },
  get:    (id)       => request(`${BASE}/${id}`),
  create: (data)     => request(BASE, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id)       => request(`${BASE}/${id}`, { method: 'DELETE' }),
  auditoria: (id)    => request(`${BASE}/${id}/auditoria`),
};
