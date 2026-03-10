import { Search, Settings } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export default function Header({ searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/90 backdrop-blur-sm px-4 sm:px-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
          C!
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight">
            Clap<span className="text-teal">.</span>Clientes
          </span>
          <span className="text-[10px] text-muted-foreground tracking-wide">
            Panel de control
          </span>
        </div>
      </div>

      {/* Search + settings */}
      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden sm:flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Buscar cliente..."
            className="h-8 w-56 pl-8"
          />
        </div>
        <Button variant="outline" size="icon" aria-label="Ajustes">
          <Settings />
        </Button>
      </div>
    </header>
  )
}
