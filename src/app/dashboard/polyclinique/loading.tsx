import { Hospital } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Hospital className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-base font-semibold">Polyclinique</p>
          <p className="animate-pulse text-sm text-muted-foreground">Chargement en cours...</p>
        </div>
      </div>
    </div>
  );
}
