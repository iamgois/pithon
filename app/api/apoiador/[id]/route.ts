import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const apoiador = await prisma.apoiador.findFirst({
      where: {
        OR: [{ id }, { codigoIndicacao: id }],
      },
      include: {
        leads: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            nome: true,
            email: true,
            intencaoVoto: true,
            createdAt: true,
          },
        },
      },
    });

    if (!apoiador) {
      return NextResponse.json(
        { error: "Apoiador não encontrado." },
        { status: 404 }
      );
    }

    const baseUrl = req.headers.get("origin") || process.env.NEXTAUTH_URL || "";
    const link = `${baseUrl}/?ref=${apoiador.codigoIndicacao}`;

    return NextResponse.json({ apoiador, link });
  } catch (error) {
    console.error("[GET /api/apoiador/[id]]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
