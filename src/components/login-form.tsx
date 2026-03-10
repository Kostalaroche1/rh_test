"use client";

import { Eye, EyeOff, Key, MailIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "./ui/checkbox";
import { AlertCustomer } from "./alerts/alerts";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [alertInfo, setAlertInfo] = useState({
    title: "Authentification",
    description: "Authentification incorrecte",
    variant: "destructive",
  });
  const [show, setShow] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("../api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ login: email, motDePasse: password }),
      });

      const result = await response.json();

      if (result.status === 200) {
        setShow(true);
        setAlertInfo({
          title: "Authentification",
          description: result.message || "Vous allez vous connecter",
          variant: "success",
        });

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 900);
        return;
      }

      setShow(true);
      setAlertInfo({
        title: "Echec de connexion",
        description: result.message || "Veuillez verifier vos identifiants",
        variant: "destructive",
      });
    } catch {
      setShow(true);
      setAlertInfo({
        title: "Echec de connexion",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.FormEvent) => {
    const { name, value } = e.target as HTMLInputElement;
    setShow(false);

    if (name === "email") setEmail(value);
    if (name === "password") setPassword(value);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleLogin}>
        <FieldGroup className="gap-5">
          <div className="flex flex-col items-center gap-2 text-center relative top-13">
            <img src="/images/logo_auth/logo_rtnc1.png" className="h-60 w-60 object-contain" alt="RTNC RH" />
            {/* <h1 className="text-xl font-bold">RTNC-RH</h1>
            <p className="text-sm text-muted-foreground">Connexion a l espace ERP RH</p> */}
          </div>

          {show && (
            <AlertCustomer
              description={alertInfo.description}
              title={alertInfo.title}
              variants={alertInfo.variant}
            />
          )}

          <div className="relative">
            <Input
              id="email"
              type="email"
              name="email"
              value={email}
              className="pl-10"
              placeholder="email@example.com"
              disabled={loading}
              onChange={handleChange}
              required
            />
            <MailIcon size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={password}
              className="pl-10 pr-10"
              placeholder="******"
              disabled={loading}
              onChange={handleChange}
              required
            />
            <Key size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <Field orientation="horizontal" className="gap-2">
              <Checkbox id="remember" name="remember" />
              <FieldLabel htmlFor="remember">Se souvenir de moi</FieldLabel>
            </Field>
            <a href="/forgot" className="text-primary hover:underline">
              Mot de passe oublie
            </a>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </FieldGroup>
      </form>

      <FieldDescription className="px-2 text-center">
        En continuant, vous acceptez les conditions d utilisation et la politique de confidentialite.
      </FieldDescription>
    </div>
  );
}
