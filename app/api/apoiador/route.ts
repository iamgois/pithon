import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nome,
      email,
      senha,
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
      return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "E-mail é obrigatório." }, { status: 400 });
    }
    if (!senha) {
      return NextResponse.json({ error: "Senha é obrigatória." }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.apoiador.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado." },
        { status: 409 }
      );
    }

    // Generate unique referral code
    let codigoIndicacao = nanoid(8).toUpperCase();
    let exists = await prisma.apoiador.findUnique({ where: { codigoIndicacao } });
    while (exists) {
      codigoIndicacao = nanoid(8).toUpperCase();
      exists = await prisma.apoiador.findUnique({ where: { codigoIndicacao } });
    }

    // Hash password
    const senhaHash = await bcrypt.hash(senha, 10);

    const apoiador = await prisma.apoiador.create({
      data: {
        nome,
        email,
        senha: senhaHash,
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
    const dashboardUrl = `${baseUrl}/dashboard/${codigoIndicacao}`;
    const loginUrl = `${baseUrl}/login`;
    const primeiroNome = nome.split(" ")[0];

    // Send confirmation email
    await resend.emails.send({
      from: "Pithon 35 <noreply@nexosales.com.br>",
      to: email,
      subject: `Bem-vindo à equipe, ${primeiroNome}! 🎉`,
      html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#141414;border-radius:12px;border:1px solid #262626;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a;padding:32px 32px 24px;border-bottom:1px solid #262626;text-align:center;">
              <p style="margin:0 0 8px;font-size:28px;font-weight:900;letter-spacing:4px;color:#ffffff;">PITHON</p>
              <p style="margin:0;font-size:13px;color:#71717a;">A humildade precede a honra</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#ffffff;">
                Olá, ${primeiroNome}! 👋
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#a1a1aa;line-height:1.6;">
                Seu cadastro foi confirmado. Você agora faz parte do movimento Pithon e já pode acessar seu painel de apoiador.
              </p>

              <!-- Stats box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border-radius:8px;border:1px solid #262626;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#71717a;">Seu link de indicação</p>
                    <p style="margin:0;font-size:13px;color:#22c55e;word-break:break-all;font-family:monospace;">${link}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:14px;color:#a1a1aa;line-height:1.6;">
                Compartilhe este link com seus contatos. Cada pessoa que apoiar através do seu link será registrada como sua indicação.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display:inline-block;background:#ffffff;color:#000000;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;">
                      Acessar meu painel →
                    </a>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display:inline-block;color:#71717a;font-size:13px;text-decoration:none;padding:8px 16px;">
                      Fazer login
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #262626;text-align:center;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                Este e-mail foi enviado porque você se cadastrou como apoiador de Pithon 35.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    });

    return NextResponse.json({ apoiador: { ...apoiador, senha: undefined }, link }, { status: 201 });
  } catch (error: unknown) {
    console.error("[POST /api/apoiador]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
