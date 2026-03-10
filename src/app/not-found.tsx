import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
            <div className="max-w-md text-center space-y-6">

                <div className="flex justify-center">
                    <div className="rounded-full bg-muted p-4">
                        <FileQuestion className="h-10 w-10 text-muted-foreground" />
                    </div>
                </div>

                <h1 className="text-4xl font-bold tracking-tight">
                    404
                </h1>

                <h2 className="text-xl font-semibold">
                    Page introuvable
                </h2>

                <p className="text-muted-foreground">
                    La page demandée n’existe pas ou a été déplacée.
                    Si vous pensez qu’il s’agit d’une erreur, veuillez contacter l’assistance.
                </p>

                <div className="space-y-3">
                    <Button asChild className="w-full">
                        <Link href="/">
                            Retour à l’accueil
                        </Link>
                    </Button>

                    <Button variant="outline" asChild className="w-full">
                        <Link href="https://cria.cd/contact" target="_blank">
                            Assistance CRIA
                        </Link>
                    </Button>
                </div>

            </div>
        </div>
    )
}