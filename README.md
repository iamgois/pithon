# Pithon — Plataforma de Campanha e Indicações

Sistema completo de captação de apoiadores e rastreamento de indicações para a campanha política do Pithon. Inclui formulário público, painel do apoiador e painel administrativo com analytics.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (Turbopack, App Router) |
| Linguagem | TypeScript |
| Banco de dados | PostgreSQL via Prisma ORM 7 |
| Autenticação | NextAuth v5 (JWT + Credentials) |
| UI | Tailwind CSS 4 + shadcn/ui + Base UI |
| Formulários | React Hook Form + Zod |
| Gráficos | Recharts |

---

## Funcionalidades

### Formulário público (`/`)
- Cadastro com nome, e-mail, WhatsApp, data de nascimento, endereço completo e nível de engajamento
- Captura automática de código de indicação via cookie (`?ref=`)
- Cria **Lead** no banco e, para quem escolhe "apoio_e_indica", cria também um **Apoiador** com link único
- Envia dados ao Google Sheets via webhook (opcional)
- Exibe link de indicação personalizado após o envio

### Painel do apoiador (`/dashboard/[codigo]`)
- Acesso público via código único
- Link de indicação com botão copiar
- Contador de indicações realizadas
- Tabela com leads indicados e intenção de voto de cada um

### Painel administrativo (`/admin`)
- Acesso protegido por login/senha
- **Aba Apoiadores:** ranking por indicações, tabela com nome, e-mail, total e data
- **Aba Intenção de Voto:** contagem de Sim / Não / Indecisos, gráfico de pizza, filtros por apoiador e data, exportação CSV

---

## Estrutura de pastas

```
pithon/
├── app/
│   ├── page.tsx                        # Formulário público
│   ├── layout.tsx                      # Layout raiz
│   ├── dashboard/[codigo]/page.tsx     # Painel do apoiador
│   ├── admin/
│   │   ├── layout.tsx                  # Layout pass-through
│   │   ├── login/page.tsx              # Login admin
│   │   └── (protected)/
│   │       ├── layout.tsx              # Verificação de sessão
│   │       └── page.tsx                # Dashboard admin
│   └── api/
│       ├── lead/route.ts               # POST: criar lead
│       ├── apoiador/route.ts           # POST: criar apoiador
│       ├── apoiador/[id]/route.ts      # GET: dados do apoiador
│       ├── admin/stats/route.ts        # GET: stats agregados (protegido)
│       ├── submit/route.ts             # POST: webhook Google Sheets
│       └── auth/[...nextauth]/route.ts # Handlers NextAuth
├── lib/
│   ├── prisma.ts                       # Cliente Prisma (singleton + PrismaPg adapter)
│   └── auth.ts                         # Configuração NextAuth
├── components/ui/                      # Componentes shadcn/ui
├── prisma/
│   ├── schema.prisma                   # Modelos do banco
│   └── seed.ts                         # Cria admin padrão
├── proxy.ts                            # Middleware: tracking ?ref= e proteção /admin
└── prisma.config.ts                    # Configuração Prisma v7
```

---

## Banco de dados

```prisma
Apoiador        # Quem apoia e indica
  ├── codigoIndicacao (único, 8 chars)
  └── totalIndicacoes

Lead            # Quem se cadastrou via formulário
  ├── intencaoVoto ("sim" | "nao" | "indeciso")
  └── origemCodigo → Apoiador

Indicacao       # Relação entre Apoiador e Lead
Admin           # Usuários do painel administrativo
```

---

## Variáveis de ambiente

Configure o arquivo `.env.local`:

```env
# Banco de dados (Prisma / PostgreSQL)
DATABASE_URL="postgres://..."

# NextAuth — gere em https://generate-secret.vercel.app/32
NEXTAUTH_SECRET="sua-chave-secreta"
NEXTAUTH_URL="http://localhost:3000"

# Google Sheets (opcional)
GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/..."
```

> O arquivo `.env` (raiz) deve conter apenas `DATABASE_URL` para uso do Prisma CLI.

---

## Instalação e execução

```bash
# Instalar dependências
npm install

# Rodar migrations e seed (cria tabelas + admin padrão)
npx prisma migrate dev --name init
npx prisma db seed

# Servidor de desenvolvimento
npm run dev
```

Acesse em [http://localhost:3000](http://localhost:3000).

---

## Acesso admin

| Campo | Valor padrão |
|-------|-------------|
| URL | `/admin/login` |
| E-mail | `admin@pithon.com.br` |
| Senha | `admin123` |

> Altere a senha editando `prisma/seed.ts` e rodando `npx prisma db seed` novamente.

---

## Comandos úteis

```bash
npm run dev        # Dev server (Turbopack)
npm run build      # Build de produção
npm run lint       # ESLint

npx prisma studio                        # Interface visual do banco
npx prisma migrate dev --name <nome>     # Nova migration
npx prisma db seed                       # Recriar admin padrão
```

---

## Como funciona o sistema de indicações

1. Apoiador se cadastra escolhendo **"apoio_e_indica"**
2. Recebe um link único: `https://seudominio.com/?ref=ABC12345`
3. Compartilha o link com outras pessoas
4. Ao acessar o link, o código é salvo em cookie por 7 dias
5. Ao preencher o formulário, o lead é vinculado automaticamente ao apoiador
6. O contador `totalIndicacoes` do apoiador é incrementado
7. Apoiador acompanha em tempo real em `/dashboard/ABC12345`

---

## Integração com Google Sheets

O sistema envia os dados do formulário para uma planilha do Google em paralelo ao banco de dados.

### Configurar Apps Script

1. Acesse [sheets.google.com](https://sheets.google.com) e crie uma planilha
2. Clique em **Extensões → Apps Script** e cole o código abaixo:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Data/Hora", "Nome", "E-mail", "WhatsApp",
      "Nascimento", "Endereço", "Bairro", "Cidade", "Estado", "Engajamento"
    ]);
    sheet.getRange(1, 1, 1, 10).setFontWeight("bold");
  }

  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.dataHora, data.nome, data.email, data.whatsapp,
    data.dataNascimento, data.endereco, data.bairro,
    data.cidade, data.estado, data.engajamento,
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Clique em **Implantar → Nova implantação → App da Web**
4. Defina acesso como **Qualquer pessoa** e copie a URL gerada
5. Adicione no `.env.local`: `GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/...`
