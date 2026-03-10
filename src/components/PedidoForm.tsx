import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ImageIcon, Loader2, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
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
  siblingPedidos?: Pedido[]
  onSave: (data: any) => Promise<any>
  onUpdate: (id: string, data: any) => Promise<any>
  onDelete: (id: string) => Promise<any>
  onCancel: () => void
  onNavigate?: (pedidoId: string) => void
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
  siblingPedidos,
  onSave,
  onUpdate,
  onDelete,
  onCancel,
  onNavigate,
}: PedidoFormProps) {
  const [form, setForm] = useState(emptyPedido)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Depend on IDs, not object references — prevents background refresh from resetting the form
  const pedidoId = editingPedido?.id ?? null
  const firstGrupoId = grupos[0]?.id ?? ''
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
      setForm({ ...emptyPedido, grupoId: firstGrupoId })
    }
    setShowDeleteConfirm(false)
    setLightboxIndex(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId, firstGrupoId])

  // Keyboard navigation for lightbox — capture phase to intercept Dialog's Escape handler
  useEffect(() => {
    if (lightboxIndex === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setLightboxIndex(null)
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex(i => (i !== null && i > 0 ? i - 1 : i))
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex(i => (i !== null && i < form.imagenes.length - 1 ? i + 1 : i))
      }
    }
    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [lightboxIndex, form.imagenes.length])

  const set = (field: string, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }))

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

  // ── Pedido carousel navigation ─────────────────────────────────────────────
  const currentIndex = editingPedido && siblingPedidos
    ? siblingPedidos.findIndex(p => p.id === editingPedido.id)
    : -1

  const hasPrev = currentIndex > 0
  const hasNext = siblingPedidos ? currentIndex < siblingPedidos.length - 1 : false
  const showNavigation = !!(editingPedido && siblingPedidos && siblingPedidos.length > 1 && onNavigate)

  const handlePrev = () => {
    if (hasPrev && siblingPedidos && onNavigate) onNavigate(siblingPedidos[currentIndex - 1].id)
  }
  const handleNext = () => {
    if (hasNext && siblingPedidos && onNavigate) onNavigate(siblingPedidos[currentIndex + 1].id)
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const saldo = form.total - form.sena
  const selectedGrupo = grupos.find(g => g.id === form.grupoId)

  return (
    <>
      <Dialog open onOpenChange={open => !open && onCancel()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <DialogTitle>
                {editingPedido ? 'Editar pedido' : 'Nuevo pedido'}
              </DialogTitle>

              {showNavigation && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={handlePrev}
                    disabled={!hasPrev}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                    aria-label="Pedido anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-muted-foreground tabular-nums px-1.5 min-w-[2.5rem] text-center">
                    {currentIndex + 1} / {siblingPedidos!.length}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={!hasNext}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                    aria-label="Siguiente pedido"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Form body — onPaste here to capture paste anywhere in the form */}
          <div className="flex flex-col lg:flex-row gap-6" onPaste={handlePaste}>
            {/* ── Left: fields ───────────────────────────────────────────── */}
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
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
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
                      id="total" type="number" className="pl-6"
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
                      id="sena" type="number" className="pl-6"
                      value={form.sena.toString()}
                      onChange={e => set('sena', Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fechaSena">Fecha seña</Label>
                  <Input id="fechaSena" type="date" value={form.fechaSena} onChange={e => set('fechaSena', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="fechaEntrega">Entrega</Label>
                  <Input id="fechaEntrega" type="date" value={form.fechaEntrega} onChange={e => set('fechaEntrega', e.target.value)} />
                </div>
              </div>

              {/* Saldo */}
              <div className="flex items-center justify-between rounded-md border border-border bg-muted px-4 py-3">
                <span className="text-xs text-muted-foreground">Saldo pendiente</span>
                <span className="text-base font-semibold" style={{ color: saldo > 0 ? '#fb923c' : '#2dd4bf' }}>
                  ${saldo.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* ── Right: images ──────────────────────────────────────────── */}
            <div className="w-full lg:w-44 shrink-0 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label>Imágenes</Label>
                {form.imagenes.length > 0 && (
                  <label className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                    + añadir
                    <input type="file" accept="image/*" multiple onChange={handleFiles} className="sr-only" />
                  </label>
                )}
              </div>

              {form.imagenes.length === 0 ? (
                <label className="relative flex-1 min-h-[160px] rounded-md border-2 border-dashed border-border bg-muted flex flex-col items-center justify-center cursor-pointer hover:border-ring/50 hover:bg-muted/80 transition-colors group">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors pointer-events-none">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[10px] text-center leading-relaxed">Pegar o<br />seleccionar</span>
                  </div>
                  <input type="file" accept="image/*" multiple onChange={handleFiles} className="sr-only" />
                </label>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 max-h-[240px] overflow-y-auto">
                  {form.imagenes.map((img, i) => (
                    <div
                      key={i}
                      className="relative group/img aspect-square rounded-md overflow-hidden border border-border cursor-zoom-in"
                      onClick={() => setLightboxIndex(i)}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-4 h-4 text-white/80 pointer-events-none" />
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setForm(prev => ({ ...prev, imagenes: prev.imagenes.filter((_, j) => j !== i) }))
                          }}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500/90 hover:bg-red-500 rounded-full text-white flex items-center justify-center transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            {formError && <p className="mr-auto text-xs text-red-400">{formError}</p>}
            {editingPedido && (
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                {showDeleteConfirm ? 'Confirmar' : 'Eliminar'}
              </Button>
            )}
            <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {editingPedido ? 'Actualizar' : 'Crear pedido'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Image lightbox (portal @ document.body) ───────────────────────── */}
      {lightboxIndex !== null && createPortal(
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex flex-col select-none"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Header: counter + close */}
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-sm text-white/40 tabular-nums">
              {lightboxIndex + 1} / {form.imagenes.length}
            </span>
            <button
              onClick={() => setLightboxIndex(null)}
              className="flex items-center justify-center w-8 h-8 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main: prev — image — next */}
          <div
            className="flex-1 flex items-center min-h-0 gap-4 px-4"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxIndex(i => i !== null && i > 0 ? i - 1 : i)}
              disabled={lightboxIndex === 0}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed text-white transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 flex items-center justify-center min-w-0 h-full">
              <img
                src={form.imagenes[lightboxIndex]}
                alt=""
                className="max-w-full object-contain rounded-md"
                style={{ maxHeight: 'calc(100vh - 180px)' }}
              />
            </div>

            <button
              onClick={() => setLightboxIndex(i => i !== null && i < form.imagenes.length - 1 ? i + 1 : i)}
              disabled={lightboxIndex >= form.imagenes.length - 1}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed text-white transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Thumbnail strip */}
          {form.imagenes.length > 1 && (
            <div
              className="flex justify-center gap-2 py-4 px-4 shrink-0 overflow-x-auto"
              onClick={e => e.stopPropagation()}
            >
              {form.imagenes.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className={`w-12 h-12 shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                    i === lightboxIndex
                      ? 'border-white opacity-100 scale-110'
                      : 'border-white/20 opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}
