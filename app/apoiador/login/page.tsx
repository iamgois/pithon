"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function ApoiadorLoginPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = codigo.trim();
    if (!trimmed) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/apoiador/${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        setError("Código não encontrado. Verifique e tente novamente.");
        return;
      }
      router.push(`/dashboard/${trimmed}`);
    } catch {
      setError("Erro ao verificar o código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Área do Apoiador</CardTitle>
          <CardDescription>
            Digite seu código de indicação para acessar seu painel.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="codigo">Código de indicação</Label>
              <Input
                id="codigo"
                type="text"
                placeholder="Ex: AB12CD34"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                required
                autoComplete="off"
                autoFocus
                maxLength={20}
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading || !codigo.trim()}>
              {loading ? "Verificando..." : "Acessar painel"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
