import { useState, useCallback, useEffect } from 'react'
import type { Cliente, Grupo, Pedido } from '../types'
import { api, API_URL } from '../api/api'

export function useStore() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [editingClienteId, setEditingClienteId] = useState<string | null>(null)
  const [editingPedidoId, setEditingPedidoId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [serverError, setServerError] = useState<string | null>(null)

  const refreshData = useCallback(async (force = false) => {
    // Skip background refresh while any form/dialog is open to avoid resetting unsaved input
    if (!force && document.querySelector('[role="dialog"]')) return
    setIsLoading(true)
    try {
      // Migrar datos legacy de localStorage si existen
      const legacyClientes = localStorage.getItem('clap_clientes')
      const legacyGrupos = localStorage.getItem('clap_grupos')

      if (legacyClientes || legacyGrupos) {
        console.log('Migrando datos legacy...')
        try {
          await fetch(`${API_URL}/migrate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientes: JSON.parse(legacyClientes || '[]'),
              grupos: JSON.parse(legacyGrupos || '[]')
            })
          })
        } catch {
          console.warn('Migración fallida, se omite.')
        }
        localStorage.removeItem('clap_clientes')
        localStorage.removeItem('clap_grupos')
      }

      const [g, c, p] = await Promise.all([
        api.getGrupos(),
        api.getClientes(),
        api.getPedidos()
      ])
      setGrupos(g)
      setClientes(c)
      setPedidos(p)
      setServerError(null)
    } catch (error) {
      console.error('Error cargando datos:', error)
      setServerError('No se puede conectar al servidor. Asegurate de que esté corriendo en el puerto 3001.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshData(true)                          // initial load always runs
    const interval = setInterval(refreshData, 30000)  // background: skip if dialog open
    return () => clearInterval(interval)
  }, [refreshData])

  // --- GRUPOS ---
  const addGrupo = useCallback(async (nombre: string, color: string) => {
    const nuevo = await api.addGrupo({
      nombre: nombre.toUpperCase(),
      color,
      orden: grupos.length
    })
    if (!nuevo?.id) throw new Error('Respuesta inválida del servidor')
    setGrupos(prev => [...prev, nuevo])
    return nuevo
  }, [grupos.length])

  const deleteGrupo = useCallback(async (id: string) => {
    // Actualización optimista: eliminar del estado inmediatamente
    setGrupos(prev => prev.filter(g => g.id !== id))
    setPedidos(prev => prev.filter(p => p.grupoId !== id))
    try {
      const res = await api.deleteGrupo(id)
      if (!res.ok && res.status !== 204) {
        // Revertir si el servidor devuelve error
        await refreshData()
        throw new Error(`Error ${res.status} al eliminar el grupo`)
      }
    } catch (e) {
      if ((e as any)?.message?.includes('Error')) throw e
      // Error de red — revertir
      await refreshData()
      throw new Error('No se pudo eliminar: el servidor no está disponible')
    }
  }, [refreshData])

  // --- CLIENTES ---
  const addCliente = useCallback(async (data: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>) => {
    const nuevo = await api.addCliente(data)
    if (!nuevo?.id) throw new Error('Error al crear cliente')
    setClientes(prev => [...prev, nuevo])
    return nuevo
  }, [])

  const updateCliente = useCallback(async (id: string, data: Partial<Omit<Cliente, 'id' | 'createdAt'>>) => {
    const actualizado = await api.updateCliente(id, data)
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...actualizado } : c))
  }, [])

  const deleteCliente = useCallback(async (id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id))
    setPedidos(prev => prev.filter(p => p.clienteId !== id))
    await api.deleteCliente(id)
  }, [])

  // --- PEDIDOS ---
  const addPedido = useCallback(async (data: any) => {
    const nuevo = await api.addPedido(data)
    if (!nuevo?.id) throw new Error('Error al crear pedido: respuesta inválida del servidor')
    setPedidos(prev => [...prev, nuevo])
    return nuevo
  }, [])

  const updatePedido = useCallback(async (id: string, data: any) => {
    const actualizado = await api.updatePedido(id, data)
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, ...actualizado } : p))
  }, [])

  const deletePedido = useCallback(async (id: string) => {
    setPedidos(prev => prev.filter(p => p.id !== id))
    await api.deletePedido(id)
  }, [])

  const movePedido = useCallback(async (pedidoId: string, newGrupoId: string) => {
    // Optimistic update
    setPedidos(prev =>
      prev.map(p => p.id === pedidoId ? { ...p, grupoId: newGrupoId } : p)
    )
    await api.updatePedido(pedidoId, { grupoId: newGrupoId })
  }, [])

  const getPedidosByGrupo = useCallback(
    (grupoId: string) => {
      let filtered = pedidos.filter(p => p.grupoId === grupoId)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        filtered = filtered.filter(p => {
          const cliente = clientes.find(c => c.id === p.clienteId)
          return (
            cliente?.nombre.toLowerCase().includes(q) ||
            p.descripcion.toLowerCase().includes(q) ||
            cliente?.whatsapp.includes(q)
          )
        })
      }
      return filtered
    },
    [pedidos, clientes, searchQuery]
  )

  const getPedidosByCliente = useCallback(
    (clienteId: string) => pedidos.filter(p => p.clienteId === clienteId),
    [pedidos]
  )

  const editingCliente = editingClienteId
    ? clientes.find(c => c.id === editingClienteId) || null
    : null

  const editingPedido = editingPedidoId
    ? pedidos.find(p => p.id === editingPedidoId) || null
    : null

  return {
    clientes,
    grupos,
    pedidos,
    isLoading,
    serverError,
    searchQuery,
    editingCliente,
    editingClienteId,
    editingPedido,
    editingPedidoId,
    setSearchQuery,
    setEditingClienteId,
    setEditingPedidoId,
    addGrupo,
    deleteGrupo,
    addCliente,
    updateCliente,
    deleteCliente,
    addPedido,
    updatePedido,
    deletePedido,
    movePedido,
    getPedidosByGrupo,
    getPedidosByCliente,
    refreshData
  }
}
