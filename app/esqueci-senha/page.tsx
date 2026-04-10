"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erro ao enviar. Tente novamente.");
        return;
      }
      setSent(true);
    } catch {
      setError("Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Esqueci minha senha</CardTitle>
          <CardDescription>
            {sent
              ? "Verifique seu e-mail."
              : "Digite seu e-mail e enviaremos um link para redefinir sua senha."}
          </CardDescription>
        </CardHeader>

        {sent ? (
          <CardContent className="flex flex-col items-center gap-4 py-4">
            <div className="text-5xl">📬</div>
            <p className="text-sm text-center text-muted-foreground">
              Se houver uma conta associada a <strong>{email}</strong>, você
              receberá um e-mail com as instruções. O link expira em 1 hora.
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="flex flex-col gap-4">
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading || !email.trim()}
              >
                {loading ? "Enviando..." : "Enviar link de redefinição"}
              </Button>
            </CardFooter>
          </form>
        )}

        <div className="pb-6 flex justify-center">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground gap-1.5"
            )}
          >
            <ArrowLeftIcon className="size-4" />
            Voltar ao login
          </Link>
        </div>
      </Card>
    </div>
  );
}
