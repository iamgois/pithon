"use client";

import { use, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Lead {
  id: string;
  nome: string;
  email: string;
  intencaoVoto: string;
  createdAt: string;
}

interface Apoiador {
  id: string;
  nome: string;
  email: string;
  codigoIndicacao: string;
  totalIndicacoes: number;
  createdAt: string;
  leads: Lead[];
}

function getVotoBadgeVariant(voto: string): "default" | "secondary" | "destructive" {
  if (voto === "sim") return "default";
  if (voto === "nao") return "destructive";
  return "secondary";
}

function getVotoLabel(voto: string): string {
  if (voto === "sim") return "Sim";
  if (voto === "nao") return "Não";
  return "Indeciso";
}

export default function DashboardPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = use(params);
  const [apoiador, setApoiador] = useState<Apoiador | null>(null);
  const [link, setLink] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/apoiador/${codigo}`)
      .then((r) => {
        if (!r.ok) throw new Error("Apoiador não encontrado.");
        return r.json();
      })
      .then((data) => {
        setApoiador(data.apoiador);
        setLink(data.link);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [codigo]);

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (error || !apoiador) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center p-8">
          <CardTitle className="text-lg mb-2">Apoiador não encontrado</CardTitle>
          <CardDescription>{error || "Código inválido."}</CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl flex flex-col gap-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Olá, {apoiador.nome.split(" ")[0]}!</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhe aqui as suas indicações para o movimento Pithon.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Indicações</CardDescription>
              <CardTitle className="text-4xl">{apoiador.totalIndicacoes}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Membro desde</CardDescription>
              <CardTitle className="text-lg">
                {new Date(apoiador.createdAt).toLocaleDateString("pt-BR")}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Referral link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seu link de indicação</CardTitle>
            <CardDescription>
              Compartilhe este link para convidar mais pessoas a apoiar Pithon.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              readOnly
              value={link}
              className="text-sm"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button variant="outline" onClick={handleCopy} className="shrink-0">
              {copied ? "Copiado!" : "Copiar"}
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Leads table */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Pessoas que você indicou</h2>
          {apoiador.leads.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                Você ainda não tem indicações. Compartilhe seu link!
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Intenção de Voto</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apoiador.leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.nome}</TableCell>
                      <TableCell>
                        <Badge variant={getVotoBadgeVariant(lead.intencaoVoto)}>
                          {getVotoLabel(lead.intencaoVoto)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
