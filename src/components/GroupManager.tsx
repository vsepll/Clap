import { useState } from 'react'
import { ChevronDown, Plus, Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Grupo } from '../types'

const PRESET_COLORS = [
  '#2dd4bf', '#3b82f6', '#6366f1', '#8b5cf6',
  '#ec4899', '#f43f5e', '#fb923c', '#eab308',
  '#22c55e', '#06b6d4', '#a855f7', '#ef4444',
]

interface GroupManagerProps {
  grupos: Grupo[]
  onAddGrupo: (nombre: string, color: string) => void
  onDeleteGrupo: (id: string) => void
}

export default function GroupManager({ grupos, onAddGrupo, onDeleteGrupo }: GroupManagerProps) {
  const [nombre, setNombre] = useState('')
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!nombre.trim()) return
    setError(null)
    try {
      await onAddGrupo(nombre.trim(), selectedColor)
      setNombre('')
    } catch {
      setError('No se pudo crear el grupo.')
    }
  }

  const handleDelete = async (id: string) => {
    setError(null)
    try {
      await onDeleteGrupo(id)
    } catch {
      setError('No se pudo eliminar el grupo.')
    }
  }

  return (
    <div className="border-b border-border">
      {/* Toggle row */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 sm:px-6 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Settings className="h-3.5 w-3.5" />
        <span className="font-medium">Configuración</span>
        <span className="text-border hidden sm:inline">—</span>
        <span className="hidden sm:inline opacity-70">Gestión de columnas</span>
        <ChevronDown className={`ml-auto h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Collapsible content */}
      <div className={`grid transition-all duration-200 overflow-hidden ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="min-h-0 px-4 sm:px-6 pb-4 space-y-3">
          {/* Input row */}
          <div className="flex flex-col sm:flex-row gap-2 pt-3">
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Nombre del nuevo estado..."
              className="flex-1 h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 hover:border-muted-foreground transition-colors"
            />

            {/* Color picker */}
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 h-9">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  title={c}
                  className={`h-4 w-4 rounded-full shrink-0 transition-transform ${selectedColor === c ? 'ring-2 ring-white ring-offset-1 ring-offset-card scale-110' : 'opacity-60 hover:opacity-100 hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <Button onClick={handleCreate} size="default" className="shrink-0 h-9">
              <Plus data-icon="inline-start" className="h-4 w-4" />
              Añadir
            </Button>
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {/* Existing groups */}
          {grupos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {grupos.map(g => (
                <Badge
                  key={g.id}
                  variant="outline"
                  className="gap-1.5 pl-1.5 pr-1"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: g.color }}
                  />
                  {g.nombre}
                  <button
                    type="button"
                    onClick={() => handleDelete(g.id)}
                    className="ml-0.5 flex items-center"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
