"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { KeySquare } from "lucide-react";
import { useState } from "react";
import { usePost } from "@/hooks/useApi";
import { resetPassword } from "@/app/action/agent/action";
import { toast, Toaster } from "sonner";
import { Label } from "../ui/label";

export function PasswordReset({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [password, setPassword] = useState({
    newPassword: "",
    CfrPassword: "",
  });
  const { mutateAsync, isPending } = usePost(resetPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.newPassword.length < 8 || password.CfrPassword.length < 8) {
      toast.error("Le mot de passe doit comporter au moins 8 caracteres");
      return;
    }

    if (!password.newPassword || !password.CfrPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (password.newPassword !== password.CfrPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const response = await mutateAsync(password.newPassword);

      if (response.status === 200) {
        toast.success("Mot de passe reinitialise avec succes");
        setTimeout(() => {
          router.replace("/");
        }, 1500);
      } else {
        toast.error(response.message || "Erreur lors de la reinitialisation");
      }
    } catch (_) {
      toast.error("Erreur serveur");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup className="gap-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/images/logo_auth/logo_rtnc1.png" className="h-24 w-24 object-contain" alt="RTNC RH" />
          <Label className="text-xl">Nouveau mot de passe</Label>
        </div>

        <Field>
          <div className="relative">
            <Input
              id="new-password"
              type="password"
              className="pl-10"
              placeholder="Nouveau mot de passe"
              value={password.newPassword}
              disabled={isPending}
              onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
              required
            />
            <KeySquare
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </Field>

        <Field>
          <div className="relative">
            <Input
              id="confirm-password"
              type="password"
              className="pl-10"
              placeholder="Confirmer le mot de passe"
              value={password.CfrPassword}
              disabled={isPending}
              onChange={(e) => setPassword({ ...password, CfrPassword: e.target.value })}
              required
            />
            <KeySquare
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </Field>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Reinitialisation..." : "Reinitialiser"}
        </Button>

        <FieldSeparator />

        <Field>
          <FieldDescription className="text-center">
            Vous avez deja un compte ?{" "}
            <a href="/" className="underline underline-offset-4">
              Se connecter
            </a>
          </FieldDescription>
        </Field>

        <Toaster richColors />
      </FieldGroup>
    </form>
  );
}
