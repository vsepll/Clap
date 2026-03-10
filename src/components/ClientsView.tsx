import { useStore } from '../store/useStore'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './ui/table'
import { Button } from './ui/button'
import { Edit2, MessageSquare, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ClientsView() {
    const store = useStore()

    const filteredClientes = store.clientes.filter(cliente => {
        if (!store.searchQuery.trim()) return true
        const q = store.searchQuery.toLowerCase()
        return (
            cliente.nombre.toLowerCase().includes(q) ||
            cliente.whatsapp.includes(q)
        )
    })

    return (
        <div className="flex flex-col gap-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Todos los Clientes</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {filteredClientes.length} clientes encontrados
                </span>
            </div>

            <div className="rounded-md border border-border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="w-[250px]">Nombre</TableHead>
                            <TableHead>WhatsApp</TableHead>
                            <TableHead>Registrado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClientes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No se encontraron clientes.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredClientes.map((cliente) => (
                                <TableRow key={cliente.id}>
                                    <TableCell className="font-medium">{cliente.nombre}</TableCell>
                                    <TableCell>
                                        <a
                                            href={`https://wa.me/${cliente.whatsapp.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-teal hover:underline"
                                        >
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            {cliente.whatsapp}
                                        </a>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {format(new Date(cliente.createdAt), 'dd MMM yyyy', { locale: es })}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() => store.setEditingClienteId(cliente.id)}
                                            title="Editar cliente"
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
