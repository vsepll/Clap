// URL relativa: funciona tanto en dev (con proxy Vite) como en producción (Cloudflare Tunnel)
export const API_URL = '/api';

export const api = {
    // Grupos
    getGrupos: () => fetch(`${API_URL}/grupos`).then(res => res.json()),
    addGrupo: (data: any) => fetch(`${API_URL}/grupos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    deleteGrupo: (id: string) => fetch(`${API_URL}/grupos/${id}`, { method: 'DELETE' }),

    // Clientes
    getClientes: () => fetch(`${API_URL}/clientes`).then(res => res.json()),
    addCliente: (data: any) => fetch(`${API_URL}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    updateCliente: (id: string, data: any) => fetch(`${API_URL}/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    deleteCliente: (id: string) => fetch(`${API_URL}/clientes/${id}`, { method: 'DELETE' }),

    // Pedidos
    getPedidos: () => fetch(`${API_URL}/pedidos`).then(res => res.json()),
    addPedido: (data: any) => fetch(`${API_URL}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    updatePedido: (id: string, data: any) => fetch(`${API_URL}/pedidos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    deletePedido: (id: string) => fetch(`${API_URL}/pedidos/${id}`, { method: 'DELETE' }),
};
