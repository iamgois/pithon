import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, email, telefone, dataNascimento, endereco, bairro, cidade, estado, engajamento } = body;

    if (!nome || !email) {
      return NextResponse.json(
        { error: "Nome e email são obrigatórios." },
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
        email,
        telefone: telefone || null,
        dataNascimento: dataNascimento || null,
        endereco: endereco || null,
        bairro: bairro || null,
        cidade: cidade || null,
        estado: estado || null,
        engajamento: engajamento || null,
        codigoIndicacao,
      },
    });

    const baseUrl = req.headers.get("origin") || process.env.NEXTAUTH_URL || "";
    const link = `${baseUrl}/apoiar?ref=${codigoIndicacao}`;
    const dashboardLink = `${baseUrl}/dashboard/${codigoIndicacao}`;
    const primeiroNome = nome.split(" ")[0];

    // Enviar e-mail com o link de indicação
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: "Pithon <noreply@pithon.com.br>",
        to: email,
        subject: "Seu link de indicação — Pithon",
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
            <h2 style="color:#1a1a1a;margin-bottom:8px;">Olá, ${primeiroNome}! 🎉</h2>
            <p style="color:#444;line-height:1.6;">
              Obrigado por se cadastrar como apoiador do <strong>Pithon</strong>!
              Aqui está seu link exclusivo de indicação. Compartilhe com amigos e familiares que também querem apoiar.
            </p>

            <div style="margin:24px 0;padding:16px;background:#f4f4f5;border-radius:8px;word-break:break-all;">
              <p style="margin:0 0 8px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.05em;">Seu link de indicação</p>
              <a href="${link}" style="color:#1a1a1a;font-weight:600;font-size:15px;">${link}</a>
            </div>

            <a href="${link}" style="display:inline-block;padding:12px 28px;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
              Compartilhar link
            </a>

            <hr style="margin:32px 0;border:none;border-top:1px solid #eee;" />

            <p style="color:#888;font-size:13px;">
              Acompanhe suas indicações no seu
              <a href="${dashboardLink}" style="color:#1a1a1a;">painel pessoal</a>.
            </p>

            <p style="color:#bbb;font-size:12px;margin-top:24px;">A humildade precede a honra.</p>
          </div>
        `,
      }).catch((err) => console.error("[Resend] Erro ao enviar e-mail:", err));
    }

    return NextResponse.json({ apoiador, link }, { status: 201 });
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string };
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "E-mail já cadastrado." },
        { status: 409 }
      );
    }
    console.error("[POST /api/apoiador]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
