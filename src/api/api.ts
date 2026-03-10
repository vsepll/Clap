// Usamos la IP/Hostname actual para que sea accesible desde celulares y otros PCs en la misma red
export const SERVER_IP = window.location.hostname;
export const API_URL = `http://${SERVER_IP}:3001/api`;

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
