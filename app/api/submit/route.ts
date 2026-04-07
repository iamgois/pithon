import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      { error: "Webhook não configurado." },
      { status: 500 }
    );
  }

  const body = await req.json();

  const payload = {
    nome: body.nome,
    email: body.email,
    whatsapp: body.whatsapp,
    dataNascimento: body.dataNascimento,
    endereco: body.endereco,
    bairro: body.bairro,
    cidade: body.cidade,
    estado: body.estado,
    engajamento: body.engajamento,
    dataHora: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Erro ao enviar para a planilha." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
