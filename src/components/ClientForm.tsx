import { useState, useEffect } from 'react'
import { ChevronRight, Plus, Trash2, User } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Cliente, Pedido, Grupo } from '../types'

interface ClientFormProps {
  editingCliente: Cliente | null
  pedidos: Pedido[]
  grupos: Grupo[]
  onSave: (data: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdate: (id: string, data: Partial<Omit<Cliente, 'id' | 'createdAt'>>) => void
  onDelete: (id: string) => void
  onCancelEdit: () => void
  onAddPedido: () => void
  onEditPedido: (pedidoId: string) => void
}

const emptyForm = { nombre: '', whatsapp: '' }

export default function ClientForm({
  editingCliente, pedidos, grupos,
  onSave, onUpdate, onDelete, onCancelEdit, onAddPedido, onEditPedido,
}: ClientFormProps) {
  const [form, setForm] = useState(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setForm(editingCliente ? { nombre: editingCliente.nombre, whatsapp: editingCliente.whatsapp } : emptyForm)
    setConfirmDelete(false)
  }, [editingCliente])

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = () => {
    if (!form.nombre.trim()) return
    if (editingCliente) {
      onUpdate(editingCliente.id, form)
      onCancelEdit()
    } else {
      onSave(form)
    }
  }

  const handleDelete = () => {
    if (!editingCliente) return
    if (!confirmDelete) { setConfirmDelete(true); return }
    onDelete(editingCliente.id)
    onCancelEdit()
  }

  return (
    <Dialog open onOpenChange={open => !open && onCancelEdit()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-teal">
              <User className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>{editingCliente ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
              <DialogDescription className="mt-0.5">
                {editingCliente ? 'Actualizar información del cliente' : 'Registrar nuevo cliente'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              placeholder="Nombre completo"
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              placeholder="Ej: 5491123456789"
              value={form.whatsapp}
              onChange={e => set('whatsapp', e.target.value)}
            />
          </div>
        </div>

        {/* Pedidos section — only when editing */}
        {editingCliente && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground">Pedidos</h3>
              <button
                onClick={onAddPedido}
                className="flex items-center gap-1 text-xs text-teal hover:text-teal transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Nuevo pedido
              </button>
            </div>

            {pedidos.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-6 text-center">
                <p className="text-xs text-muted-foreground">Sin pedidos registrados</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {pedidos.map(p => {
                  const grupo = grupos.find(g => g.id === p.grupoId)
                  const saldo = p.total - p.sena
                  return (
                    <button
                      key={p.id}
                      onClick={() => onEditPedido(p.id)}
                      className="w-full flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 text-left hover:border-muted-foreground transition-colors group"
                    >
                      <div className="h-5 w-0.5 rounded-full shrink-0" style={{ backgroundColor: grupo?.color ?? '#52525b' }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{p.descripcion}</p>
                        <p className="text-xs text-muted-foreground">{grupo?.nombre}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold" style={{ color: saldo > 0 ? '#fb923c' : '#2dd4bf' }}>
                          ${saldo.toLocaleString('es-AR')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">saldo</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {editingCliente && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4" />
              {confirmDelete ? 'Confirmar eliminación' : 'Eliminar'}
            </Button>
          )}
          <Button variant="ghost" onClick={onCancelEdit}>Cancelar</Button>
          <Button onClick={handleSubmit}>
            {editingCliente ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
