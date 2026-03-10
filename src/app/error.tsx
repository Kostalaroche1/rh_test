"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
            <div className="max-w-md text-center space-y-6">

                <div className="flex justify-center">
                    <div className="rounded-full bg-destructive/10 p-4">
                        <AlertTriangle className="h-10 w-10 text-destructive" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold tracking-tight">
                    Une erreur est survenue
                </h1>

                <p className="text-muted-foreground">
                    Une erreur inattendue s’est produite. Veuillez réessayer.
                    Si le problème persiste, contactez l’assistance.
                </p>

                <div className="space-y-3">
                    <Button onClick={reset} className="w-full">
                        Réessayer
                    </Button>

                    <Button variant="outline" asChild className="w-full">
                        <Link href="https://cria.cd/contact" target="_blank">
                            Contacter l’assistance
                        </Link>
                    </Button>
                </div>

            </div>
        </div>
    )
}