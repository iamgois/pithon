import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, email, telefone, intencaoVoto } = body;

    if (!nome || !email || !intencaoVoto) {
      return NextResponse.json(
        { error: "Nome, email e intenção de voto são obrigatórios." },
        { status: 400 }
      );
    }

    // Read ref_code from cookie header
    const cookieHeader = req.headers.get("cookie") || "";
    const refCodeMatch = cookieHeader.match(/ref_code=([^;]+)/);
    const origemCodigo = refCodeMatch ? refCodeMatch[1] : null;

    // Validate that the ref code exists if provided
    let apoiador = null;
    if (origemCodigo) {
      apoiador = await prisma.apoiador.findUnique({
        where: { codigoIndicacao: origemCodigo },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the lead
      const lead = await tx.lead.create({
        data: {
          nome,
          email,
          telefone: telefone || null,
          intencaoVoto,
          origemCodigo: apoiador ? origemCodigo : null,
        },
      });

      // If referred by an apoiador, create Indicacao and increment counter
      if (apoiador) {
        await tx.indicacao.create({
          data: {
            apoiadorId: apoiador.id,
            leadId: lead.id,
          },
        });

        await tx.apoiador.update({
          where: { id: apoiador.id },
          data: { totalIndicacoes: { increment: 1 } },
        });
      }

      return lead;
    });

    return NextResponse.json({ lead: result }, { status: 201 });
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string };
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "E-mail já cadastrado." },
        { status: 409 }
      );
    }
    console.error("[POST /api/lead]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
