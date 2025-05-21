import { Card, CardContent } from "@/components/ui/card"

interface ShortcutTileProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

export function ShortcutTile({ icon, label, onClick }: ShortcutTileProps) {
  return (
    <Card 
      className="hover:bg-accent cursor-pointer transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-6 flex flex-col items-center justify-center space-y-2">
        <div className="text-primary">{icon}</div>
        <span className="text-sm font-medium">{label}</span>
      </CardContent>
    </Card>
  )
} 