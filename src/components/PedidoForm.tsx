import { useState, useEffect, useCallback } from 'react'
import { ImageIcon, Loader2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from '@/components/ui/select'
import type { Pedido, Grupo } from '../types'

interface PedidoFormProps {
  clienteId: string
  grupos: Grupo[]
  editingPedido: Pedido | null
  onSave: (data: any) => Promise<any>
  onUpdate: (id: string, data: any) => Promise<any>
  onDelete: (id: string) => Promise<any>
  onCancel: () => void
}

const emptyPedido = {
  descripcion: '',
  notas: '',
  imagenes: [] as string[],
  total: 0,
  sena: 0,
  fechaSena: '',
  fechaEntrega: '',
  grupoId: '',
}

export default function PedidoForm({
  clienteId,
  grupos,
  editingPedido,
  onSave,
  onUpdate,
  onDelete,
  onCancel,
}: PedidoFormProps) {
  const [form, setForm] = useState(emptyPedido)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (editingPedido) {
      setForm({
        descripcion: editingPedido.descripcion,
        notas: editingPedido.notas,
        imagenes: editingPedido.imagenes,
        total: editingPedido.total,
        sena: editingPedido.sena,
        fechaSena: editingPedido.fechaSena,
        fechaEntrega: editingPedido.fechaEntrega,
        grupoId: editingPedido.grupoId,
      })
    } else {
      setForm({ ...emptyPedido, grupoId: grupos[0]?.id || '' })
    }
    setShowDeleteConfirm(false)
  }, [editingPedido, grupos])

  const set = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (!file) continue
        const reader = new FileReader()
        reader.onload = ev => {
          setForm(prev => ({ ...prev, imagenes: [...prev.imagenes, ev.target?.result as string] }))
        }
        reader.readAsDataURL(file)
      }
    }
  }, [])

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = ev => {
        setForm(prev => ({ ...prev, imagenes: [...prev.imagenes, ev.target?.result as string] }))
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleSubmit = async () => {
    if (!form.descripcion.trim()) { setFormError('La descripción es obligatoria'); return }
    if (!form.grupoId) { setFormError('Seleccioná un estado/grupo'); return }
    setFormError(null)
    setSaving(true)
    try {
      const data = { ...form, clienteId }
      if (editingPedido) {
        await onUpdate(editingPedido.id, data)
      } else {
        await onSave(data)
      }
      onCancel()
    } catch (e: any) {
      setFormError(e?.message || 'Error al guardar. Verificá que el servidor esté corriendo.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingPedido) return
    if (!showDeleteConfirm) { setShowDeleteConfirm(true); return }
    setSaving(true)
    try {
      await onDelete(editingPedido.id)
      onCancel()
    } catch (e: any) {
      setFormError(e?.message || 'Error al eliminar')
      setSaving(false)
    }
  }

  const saldo = form.total - form.sena

  const selectedGrupo = grupos.find(g => g.id === form.grupoId)

  return (
    <Dialog open onOpenChange={open => !open && onCancel()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingPedido ? 'Editar pedido' : 'Nuevo pedido'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: form fields */}
          <div className="flex-1 space-y-5">
            {/* Estado */}
            <div className="flex flex-col gap-1.5">
              <Label>Estado</Label>
              <Select value={form.grupoId} onValueChange={v => set('grupoId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado...">
                    {selectedGrupo && (
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: selectedGrupo.color }}
                        />
                        {selectedGrupo.nombre}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {grupos.map(g => (
                      <SelectItem key={g.id} value={g.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: g.color }}
                          />
                          {g.nombre}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Descripción + Notas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Detalles del trabajo..."
                  value={form.descripcion}
                  onChange={e => set('descripcion', e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  placeholder="Observaciones internas..."
                  value={form.notas}
                  onChange={e => set('notas', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Financial + dates */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="total">Total</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    id="total"
                    type="number"
                    className="pl-6"
                    value={form.total.toString()}
                    onChange={e => set('total', Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sena">Seña</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    id="sena"
                    type="number"
                    className="pl-6"
                    value={form.sena.toString()}
                    onChange={e => set('sena', Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fechaSena">Fecha seña</Label>
                <Input
                  id="fechaSena"
                  type="date"
                  value={form.fechaSena}
                  onChange={e => set('fechaSena', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fechaEntrega">Entrega</Label>
                <Input
                  id="fechaEntrega"
                  type="date"
                  value={form.fechaEntrega}
                  onChange={e => set('fechaEntrega', e.target.value)}
                />
              </div>
            </div>

            {/* Saldo */}
            <div className="flex items-center justify-between rounded-md border border-border bg-muted px-4 py-3">
              <span className="text-xs text-muted-foreground">Saldo pendiente</span>
              <span
                className="text-base font-semibold"
                style={{ color: saldo > 0 ? '#fb923c' : '#2dd4bf' }}
              >
                ${saldo.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          {/* Right: image upload */}
          <div className="w-full lg:w-44 shrink-0 flex flex-col gap-1.5">
            <Label>Imágenes</Label>
            <div
              className="relative flex-1 min-h-[160px] rounded-md border-2 border-dashed border-border bg-muted flex flex-col items-center justify-center cursor-pointer hover:border-ring/50 hover:bg-muted/80 transition-colors overflow-hidden group"
              onPaste={handlePaste}
              tabIndex={0}
            >
              {form.imagenes.length > 0 ? (
                <div className="absolute inset-0 p-2 grid grid-cols-2 gap-1.5 overflow-y-auto">
                  {form.imagenes.map((img, i) => (
                    <div key={i} className="relative group/img aspect-square rounded-md overflow-hidden border border-border">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setForm(prev => ({ ...prev, imagenes: prev.imagenes.filter((_, j) => j !== i) }))
                          }}
                          className="w-7 h-7 bg-red-500 rounded-full text-white flex items-center justify-center"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors pointer-events-none">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-[10px] text-center leading-relaxed">
                    Pegar o<br />seleccionar
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          {formError && (
            <p className="mr-auto text-xs text-red-400">{formError}</p>
          )}
          {editingPedido && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {showDeleteConfirm ? 'Confirmar' : 'Eliminar'}
            </Button>
          )}
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 data-icon="inline-start" className="animate-spin" />}
            {editingPedido ? 'Actualizar' : 'Crear pedido'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
