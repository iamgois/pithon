import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nome,
      telefone,
      dataNascimento,
      cidade,
      bairro,
      profissao,
      assuntosInteresse,
      hobbies,
      nivelApoio,
      canalComunicacao,
    } = body;

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório." },
        { status: 400 }
      );
    }

    let codigoIndicacao = nanoid(8);
    let exists = await prisma.apoiador.findUnique({ where: { codigoIndicacao } });
    while (exists) {
      codigoIndicacao = nanoid(8);
      exists = await prisma.apoiador.findUnique({ where: { codigoIndicacao } });
    }

    const apoiador = await prisma.apoiador.create({
      data: {
        nome,
        telefone: telefone || null,
        dataNascimento: dataNascimento || null,
        cidade: cidade || null,
        bairro: bairro || null,
        profissao: profissao || null,
        assuntosInteresse: assuntosInteresse || null,
        hobbies: hobbies || null,
        nivelApoio: nivelApoio || null,
        canalComunicacao: canalComunicacao || null,
        codigoIndicacao,
      },
    });

    const baseUrl = req.headers.get("origin") || process.env.NEXTAUTH_URL || "";
    const link = `${baseUrl}/apoiar?ref=${codigoIndicacao}`;

    return NextResponse.json({ apoiador, link }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/apoiador]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
