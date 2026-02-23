"use client";

import { MailIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { usePost } from "@/hooks/useApi";
import { forgotPassword } from "@/app/action/agent/action";
import { useState } from "react";
import { toast } from "sonner";
import { AlertCustomer } from "../alerts/alerts";

export function ForgotPassword({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { mutateAsync, isPending } = usePost(forgotPassword);
  const [email, setEmail] = useState<any>();
  const [alertMessage, setAlertMessage] = useState({
    title: "Recuperation de compte",
    description: "Vous allez etre redirige vers la page de reinitialisation",
    variants: "",
    show: false,
  });

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Le champ ne peut pas etre vide");
      return;
    }

    try {
      const forgotValid = await mutateAsync(email);

      if (forgotValid.status === 200) {
        setAlertMessage({
          ...alertMessage,
          description: forgotValid.message || "Verification validee, redirection en cours",
          variants: "success",
          show: true,
        });

        setTimeout(() => {
          window.location.href = "/passreset";
        }, 1500);

        return;
      }

      setAlertMessage({
        ...alertMessage,
        description: forgotValid.error || "Erreur lors de la recuperation",
        variants: "destructive",
        show: true,
      });
    } catch (error: any) {
      setAlertMessage({
        ...alertMessage,
        description: error?.message || "Erreur serveur",
        variants: "destructive",
        show: true,
      });
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleForgot}>
        <FieldGroup className="gap-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <img src="/images/logo_auth/logo_rtnc1.png" className="h-24 w-24 object-contain" alt="RTNC RH" />
            <h1 className="text-xl font-bold">Recuperation de compte</h1>
            <p className="text-sm text-muted-foreground">Entrez votre email professionnel</p>
          </div>

          {alertMessage.show && (
            <AlertCustomer
              description={alertMessage.description}
              title={alertMessage.title}
              variants={alertMessage.variants}
            />
          )}

          <div className="relative">
            <Input
              id="email"
              type="email"
              className="pl-10"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              required
            />
            <MailIcon
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Verification..." : "Verifier"}
          </Button>
        </FieldGroup>
      </form>

      <FieldDescription className="px-2 text-center">
        Un lien de reinitialisation vous sera propose apres verification.
      </FieldDescription>
    </div>
  );
}
