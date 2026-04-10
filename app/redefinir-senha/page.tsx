"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) setError("Link inválido. Solicite um novo.");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erro ao redefinir. Tente novamente.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Erro ao redefinir. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <CardContent className="flex flex-col items-center gap-4 py-4">
          <div className="text-5xl">✅</div>
          <p className="text-sm text-center text-muted-foreground">
            Senha redefinida com sucesso! Redirecionando para o login...
          </p>
        </CardContent>
        <div className="pb-6 flex justify-center">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground gap-1.5"
            )}
          >
            <ArrowLeftIcon className="size-4" />
            Ir para o login
          </Link>
        </div>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Nova senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm">Confirmar nova senha</Label>
          <Input
            id="confirm"
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading || !password || !confirm || !token}
        >
          {loading ? "Salvando..." : "Redefinir senha"}
        </Button>
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
      </CardFooter>
    </form>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Redefinir senha</CardTitle>
          <CardDescription>Digite e confirme sua nova senha.</CardDescription>
        </CardHeader>
        <Suspense fallback={null}>
          <ResetForm />
        </Suspense>
      </Card>
    </div>
  );
}
