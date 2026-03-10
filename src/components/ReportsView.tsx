import { useStore } from '../store/useStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './ui/table'
import { DollarSign, AlertCircle, CheckCircle2, TrendingUp, Calendar } from 'lucide-react'
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ReportsView() {
    const { pedidos, clientes } = useStore()

    // Cálculos totales
    const totalSena = pedidos.reduce((acc, p) => acc + (p.sena || 0), 0)
    const totalPendiente = pedidos.reduce((acc, p) => acc + ((p.total || 0) - (p.sena || 0)), 0)
    const totalFacturado = pedidos.reduce((acc, p) => acc + (p.total || 0), 0)

    // Agrupar por mes (usando fechaEntrega como fecha de cobro según requerimiento)
    const reportesMensuales = pedidos.reduce((acc: any, p) => {
        if (!p.fechaEntrega) return acc

        const date = parseISO(p.fechaEntrega)
        const monthKey = format(date, 'yyyy-MM')
        const monthName = format(date, 'MMMM yyyy', { locale: es })

        if (!acc[monthKey]) {
            acc[monthKey] = {
                name: monthName,
                total: 0,
                sena: 0,
                pendiente: 0,
                count: 0
            }
        }

        acc[monthKey].total += (p.total || 0)
        acc[monthKey].sena += (p.sena || 0)
        acc[monthKey].pendiente += ((p.total || 0) - (p.sena || 0))
        acc[monthKey].count += 1

        return acc
    }, {})

    const sortedMonths = Object.keys(reportesMensuales)
        .sort((a, b) => b.localeCompare(a))
        .map(key => ({ key, ...reportesMensuales[key] }))

    // Formato moneda
    const fmt = (val: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val)

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Reportes Financieros</h2>
                <p className="text-xs text-muted-foreground italic">
                    * Basado en fechas de entrega como fechas de cobro
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-teal/20 bg-teal/5">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-teal/80">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Total señas cobradas
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold flex items-center gap-1">
                            <span className="text-teal">$</span>
                            {fmt(totalSena).replace('$', '')}
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card className="border-amber-500/20 bg-amber-500/5 text-amber-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-amber-600/80">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                            Saldos pendientes
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold">
                            {fmt(totalPendiente)}
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5" />
                            Total facturado
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold">
                            {fmt(totalFacturado)}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Monthly Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-teal" />
                        Desglose Mensual
                    </CardTitle>
                    <CardDescription>Resumen de ingresos por mes de entrega</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mes</TableHead>
                                <TableHead className="text-center">Pedidos</TableHead>
                                <TableHead className="text-right">Señas</TableHead>
                                <TableHead className="text-right">Pendiente</TableHead>
                                <TableHead className="text-right font-bold">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedMonths.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No hay pedidos con fecha de entrega para reportar.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedMonths.map((m) => (
                                    <TableRow key={m.key}>
                                        <TableCell className="font-medium capitalize">{m.name}</TableCell>
                                        <TableCell className="text-center">{m.count}</TableCell>
                                        <TableCell className="text-right text-teal">{fmt(m.sena)}</TableCell>
                                        <TableCell className="text-right text-amber-600">{fmt(m.pendiente)}</TableCell>
                                        <TableCell className="text-right font-bold">{fmt(m.total)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
