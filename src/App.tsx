import { useState } from 'react'
import { Plus, AlertTriangle } from 'lucide-react'
import Header from './components/Header'
import GroupManager from './components/GroupManager'
import ClientForm from './components/ClientForm'
import PedidoForm from './components/PedidoForm'
import BoardView from './components/BoardView'
import { Button } from '@/components/ui/button'
import { useStore } from './store/useStore'

function App() {
  const store = useStore()
  const [isCreatingClient, setIsCreatingClient] = useState(false)
  const [isCreatingPedido, setIsCreatingPedido] = useState(false)

  const handleCloseClientForm = () => {
    setIsCreatingClient(false)
    store.setEditingClienteId(null)
  }

  const handleClosePedidoForm = () => {
    setIsCreatingPedido(false)
    store.setEditingPedidoId(null)
  }

  const handleOpenClientDetails = (clienteId: string) => {
    store.setEditingClienteId(clienteId)
    setIsCreatingClient(false)
  }

  const handleOpenPedidoDetails = (pedidoId: string, clienteId: string) => {
    store.setEditingPedidoId(pedidoId)
    store.setEditingClienteId(clienteId)
    setIsCreatingPedido(false)
  }

  // Navigate to another pedido in the same group (carousel)
  const handleNavigatePedido = (pedidoId: string) => {
    const pedido = store.pedidos.find(p => p.id === pedidoId)
    if (pedido) {
      store.setEditingPedidoId(pedidoId)
      store.setEditingClienteId(pedido.clienteId)
    }
  }

  // All pedidos in the same group as the current one (for carousel navigation)
  const siblingPedidos = store.editingPedido
    ? store.pedidos.filter(p => p.grupoId === store.editingPedido!.grupoId)
    : []

  const isClientFormOpen = isCreatingClient || !!store.editingClienteId
  const isPedidoFormOpen = isCreatingPedido || !!store.editingPedidoId

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-teal/20">
      <Header
        searchQuery={store.searchQuery}
        onSearchChange={store.setSearchQuery}
      />

      {store.serverError && (
        <div className="mx-4 mt-3 flex items-center gap-3 rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-2.5">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">{store.serverError}</p>
          <button
            onClick={store.refreshData}
            className="ml-auto text-xs text-red-400 hover:text-red-300 border border-red-900/50 px-2.5 py-1 rounded transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      <main className="flex-1 overflow-hidden flex flex-col mx-auto w-full px-4 lg:px-8 py-5 max-w-[1920px] gap-5">
        <div className="flex-none flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between w-full relative z-10">
          <div className="w-full sm:w-auto sm:min-w-[400px]">
            <GroupManager
              grupos={store.grupos}
              onAddGrupo={store.addGrupo}
              onDeleteGrupo={store.deleteGrupo}
            />
          </div>
          <Button onClick={() => setIsCreatingClient(true)} className="w-full sm:w-auto gap-1.5">
            <Plus data-icon="inline-start" className="h-4 w-4" />
            Nuevo cliente
          </Button>
        </div>

        <div className="flex-1 min-h-0 rounded-xl border border-border bg-card p-4 lg:p-5 relative flex flex-col z-0">
          {store.isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-teal" />
            </div>
          ) : (
            <BoardView
              grupos={store.grupos}
              clientes={store.clientes}
              getPedidosByGrupo={store.getPedidosByGrupo}
              onPedidoClick={handleOpenPedidoDetails}
              onMovePedido={store.movePedido}
            />
          )}
        </div>
      </main>

      {isClientFormOpen && (
        <ClientForm
          editingCliente={store.editingCliente}
          pedidos={store.editingClienteId ? store.getPedidosByCliente(store.editingClienteId) : []}
          grupos={store.grupos}
          onSave={async (data) => {
            const nuevo = await store.addCliente(data);
            store.setEditingClienteId(nuevo.id);
            setIsCreatingClient(false);
          }}
          onUpdate={store.updateCliente}
          onDelete={store.deleteCliente}
          onCancelEdit={handleCloseClientForm}
          onAddPedido={() => setIsCreatingPedido(true)}
          onEditPedido={(pid) => store.setEditingPedidoId(pid)}
        />
      )}

      {isPedidoFormOpen && store.editingClienteId && (
        <PedidoForm
          clienteId={store.editingClienteId}
          grupos={store.grupos}
          editingPedido={store.editingPedido}
          siblingPedidos={siblingPedidos}
          onSave={store.addPedido}
          onUpdate={store.updatePedido}
          onDelete={store.deletePedido}
          onCancel={handleClosePedidoForm}
          onNavigate={handleNavigatePedido}
        />
      )}
    </div>
  )
}

export default App
