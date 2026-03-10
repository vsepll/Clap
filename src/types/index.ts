export interface Grupo {
  id: string
  nombre: string
  color: string
  orden: number
}

export interface Cliente {
  id: string
  nombre: string
  whatsapp: string
  createdAt: string
  updatedAt: string
}

export interface Pedido {
  id: string
  clienteId: string
  grupoId: string
  descripcion: string
  notas: string
  imagenes: string[]
  total: number
  sena: number
  fechaSena: string
  fechaEntrega: string
  createdAt: string
  updatedAt: string
  cliente?: Cliente // Opcional, para cuando viene incluido
}

export type AppView = 'clientes' | 'pedidos'
