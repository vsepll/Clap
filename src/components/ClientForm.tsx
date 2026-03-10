import { useState, useEffect } from 'react'
import { ChevronRight, Plus, Trash2, User, X } from 'lucide-react'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
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

  // Depend on the ID, not the object reference — prevents refresh from resetting the form
  const clienteId = editingCliente?.id ?? null
  useEffect(() => {
    setForm(editingCliente ? { nombre: editingCliente.nombre, whatsapp: editingCliente.whatsapp } : emptyForm)
    setConfirmDelete(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId])

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
      {/*
        Mobile: bottom sheet (full-width, anchored to bottom, rounded top corners)
        Desktop: centered modal, max-w-lg
      */}
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 overflow-hidden sm:max-w-lg
          max-sm:inset-x-0 max-sm:left-0 max-sm:right-0
          max-sm:bottom-0 max-sm:top-auto
          max-sm:translate-x-0 max-sm:translate-y-0
          max-sm:max-w-none max-sm:w-full
          max-sm:rounded-t-2xl max-sm:rounded-b-none"
      >
        <div className="flex flex-col max-h-[90svh] sm:max-h-[85svh]">

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="shrink-0 flex items-center gap-3 px-5 pt-5 pb-4 border-b border-border">
            {/* Drag handle (mobile only) */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-border sm:hidden" />

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-teal">
              <User className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-medium leading-none">
                {editingCliente ? 'Editar cliente' : 'Nuevo cliente'}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs">
                {editingCliente ? 'Actualizar información del cliente' : 'Registrar nuevo cliente'}
              </DialogDescription>
            </div>
            <button
              onClick={onCancelEdit}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Scrollable body ─────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-4">

            {/* Name + WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

            {/* Pedidos list — only when editing */}
            {editingCliente && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground">Pedidos</h3>
                  <button
                    onClick={onAddPedido}
                    className="flex items-center gap-1 text-xs text-teal hover:opacity-80 transition-opacity"
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
          </div>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <div className="shrink-0 border-t border-border bg-muted/50 rounded-b-xl max-sm:rounded-b-none px-4 py-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            {editingCliente && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                size="sm"
                className="sm:mr-auto sm:size-default"
              >
                <Trash2 className="h-4 w-4" />
                {confirmDelete ? 'Confirmar eliminación' : 'Eliminar'}
              </Button>
            )}
            <Button variant="ghost" onClick={onCancelEdit} size="sm" className="sm:size-default">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} size="sm" className="sm:size-default">
              {editingCliente ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
