export function DataEmpty() {
  return <small>Aucune donnee</small>;
}

export function ZoneDonneesVides() {
  return (
    <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
      <p className="text-sm text-muted-foreground">Aucune donnee disponible pour le moment.</p>
    </div>
  );
}

