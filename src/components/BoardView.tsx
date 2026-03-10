import { useState, useCallback } from 'react'
import type { Pedido, Grupo, Cliente } from '../types'
import ClientCard from './ClientCard'

interface BoardViewProps {
  grupos: Grupo[]
  clientes: Cliente[]
  getPedidosByGrupo: (grupoId: string) => Pedido[]
  onPedidoClick: (id: string, clienteId: string) => void
  onMovePedido: (pedidoId: string, newGrupoId: string) => void
}

export default function BoardView({
  grupos,
  clientes,
  getPedidosByGrupo,
  onPedidoClick,
  onMovePedido
}: BoardViewProps) {
  const [dragOverGrupoId, setDragOverGrupoId] = useState<string | null>(null)
  const [draggingPedidoId, setDraggingPedidoId] = useState<string | null>(null)

  const handleDragStart = useCallback((_e: React.DragEvent, pedidoId: string) => {
    setDraggingPedidoId(pedidoId)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, grupoId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverGrupoId(grupoId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverGrupoId(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, grupoId: string) => {
    e.preventDefault()
    setDragOverGrupoId(null)
    if (draggingPedidoId) {
      onMovePedido(draggingPedidoId, grupoId)
      setDraggingPedidoId(null)
    }
  }, [draggingPedidoId, onMovePedido])

  if (grupos.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center max-w-sm flex flex-col items-center justify-center bg-dark-800/50 backdrop-blur-xl border border-white/5 rounded-3xl p-10 shadow-2xl">
          <p className="text-gray-200 text-base font-bold tracking-widest uppercase mb-2">Comenz&aacute; ahora</p>
          <p className="text-gray-500 text-xs tracking-wider font-medium leading-relaxed">
            Cre&aacute; tu primer grupo o estado en la secci&oacute;n superior para empezar a organizar tus pedidos.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 pt-2 snap-x absolute inset-4 lg:inset-6" onDragEnd={() => setDraggingPedidoId(null)}>
      {grupos.map(grupo => {
        const pedidos = getPedidosByGrupo(grupo.id)
        const isOver = dragOverGrupoId === grupo.id

        return (
          <div
            key={grupo.id}
            className="min-w-[320px] max-w-[360px] flex-1 flex flex-col snap-start h-full"
            onDragOver={e => handleDragOver(e, grupo.id)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, grupo.id)}
          >
            <div
              className="rounded-2xl px-5 py-4 flex items-center gap-3 backdrop-blur-md border border-white/5 shadow-lg mb-4"
              style={{ backgroundColor: `${grupo.color}15`, boxShadow: `0 4px 20px -5px ${grupo.color}20` }}
            >
              <div className="relative flex items-center justify-center">
                <span className="relative w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: grupo.color, boxShadow: `0 0 8px ${grupo.color}` }} />
              </div>
              <span className="text-[13px] font-black tracking-widest uppercase flex-1 truncate" style={{ color: grupo.color }}>
                {grupo.nombre}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm" style={{ backgroundColor: `${grupo.color}20`, color: grupo.color }}>
                {pedidos.length}
              </span>
            </div>

            <div
              className={`flex-1 rounded-3xl p-3 space-y-3 transition-all duration-300 border-2 overflow-y-auto overflow-x-hidden ${isOver ? 'border-dashed' : 'border-transparent backdrop-blur-sm'
                }`}
              style={{
                backgroundColor: isOver ? `${grupo.color}15` : 'rgba(255, 255, 255, 0.02)',
                borderColor: isOver ? `${grupo.color}50` : 'transparent',
              }}
            >
              {pedidos.map(p => (
                <ClientCard
                  key={p.id}
                  pedido={p}
                  cliente={clientes.find(c => c.id === p.clienteId)}
                  color={grupo.color}
                  onClick={() => onPedidoClick(p.id, p.clienteId)}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
