import { Download } from "lucide-react"

export default function Loading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                    {/* Cercle rotatif */}
                    <div className="h-20 w-20 rounded-full border-4 border-muted border-t-primary animate-spin" />

                    {/* Icône centrale */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Download className="h-8 w-8 text-primary" />
                    </div>
                </div>

                <p className="text-sm text-muted-foreground animate-pulse">
                    Chargement en cours...
                </p>
            </div>
        </div>
    )
}