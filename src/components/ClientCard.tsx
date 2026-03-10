import { useState } from 'react'
import { Calendar } from 'lucide-react'
import type { Pedido, Cliente } from '../types'

interface ClientCardProps {
  pedido: Pedido
  cliente: Cliente | undefined
  color: string
  onClick: () => void
  onDragStart: (e: React.DragEvent, pedidoId: string) => void
}

export default function ClientCard({ pedido, cliente, color, onClick, onDragStart }: ClientCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const saldo = pedido.total - pedido.sena
  const initial = (cliente?.nombre.charAt(0) || '?').toUpperCase()

  return (
    <div
      draggable
      onDragStart={e => {
        setIsDragging(true)
        onDragStart(e, pedido.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onDragEnd={() => setIsDragging(false)}
      onClick={onClick}
      className={`group relative select-none rounded-lg border border-border bg-card p-4 cursor-pointer transition-all hover:border-border/60 hover:bg-card/80 ${isDragging ? 'opacity-40 scale-95' : ''}`}
    >
      {/* Color accent bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: color }}
      />

      <div className="pl-3">
        {/* Client name + avatar */}
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold"
            style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}30` }}
          >
            {initial}
          </div>
          <p className="text-sm font-medium truncate leading-none">
            {cliente?.nombre || 'Cliente desconocido'}
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground truncate mb-3">
          {pedido.descripcion}
        </p>

        {/* Footer: amount + date */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">
              {saldo > 0 ? 'Saldo pendiente' : 'Pagado'}
            </p>
            <p className="text-sm font-semibold" style={{ color: saldo > 0 ? color : '#2dd4bf' }}>
              ${(saldo > 0 ? saldo : pedido.total).toLocaleString('es-AR')}
            </p>
          </div>

          {pedido.fechaEntrega && (
            <div className="flex items-center gap-1 text-muted-foreground shrink-0">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">
                {new Date(pedido.fechaEntrega + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
