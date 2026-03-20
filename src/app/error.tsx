"use client"

import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [pendingAction, setPendingAction] = useState<"retry" | "support" | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    console.error(error)
  }, [error])

  const isBusy = isPending || pendingAction !== null

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight">Une erreur est survenue</h1>

        <p className="text-muted-foreground">
          Une erreur inattendue s'est produite. Veuillez reessayer. Si le probleme persiste,
          contactez l'assistance.
        </p>

        <div className="space-y-3">
          <Button
            className="w-full"
            disabled={isBusy}
            onClick={() => {
              setPendingAction("retry")
              startTransition(() => {
                reset()
                setPendingAction(null)
              })
            }}
          >
            {pendingAction === "retry" || isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reessai en cours...
              </>
            ) : (
              "Reessayer"
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full"
            disabled={isBusy}
            onClick={() => {
              setPendingAction("support")
              window.open("https://cria.cd/contact", "_blank", "noopener,noreferrer")
              setTimeout(() => setPendingAction(null), 1200)
            }}
          >
            {pendingAction === "support" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ouverture de l'assistance...
              </>
            ) : (
              "Contacter l'assistance"
            )}
          </Button>
        </div>

        {isBusy && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>
              {pendingAction === "support"
                ? "Redirection en cours..."
                : "Traitement en cours..."}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
