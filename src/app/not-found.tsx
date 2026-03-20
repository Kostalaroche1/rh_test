"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileQuestion, Loader2 } from "lucide-react"

export default function NotFound() {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<"home" | "support" | null>(null)
  const [isPending, startTransition] = useTransition()
  const isBusy = isPending || pendingAction !== null

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <FileQuestion className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight">404</h1>

        <h2 className="text-xl font-semibold">Page introuvable</h2>

        <p className="text-muted-foreground">
          La page demandee n'existe pas ou a ete deplacee. Si vous pensez qu'il s'agit d'une erreur,
          veuillez contacter l'assistance.
        </p>

        <div className="space-y-3">
          <Button
            className="w-full"
            disabled={isBusy}
            onClick={() => {
              setPendingAction("home")
              startTransition(() => {
                router.push("/")
              })
            }}
          >
            {pendingAction === "home" || isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Retour en cours...
              </>
            ) : (
              "Retour a l'accueil"
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
              "Assistance CRIA"
            )}
          </Button>
        </div>

        {isBusy && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>
              {pendingAction === "support"
                ? "Redirection en cours..."
                : "Navigation en cours..."}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
