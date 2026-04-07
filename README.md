# Pithon — Cadastro de Apoiadores

Formulário mobile-first para cadastro de apoiadores da campanha Pithon.

## Ferramentas

- **[Next.js 16](https://nextjs.org/)** — framework React com App Router e Turbopack
- **[React 19](https://react.dev/)** — biblioteca de interface
- **[TypeScript](https://www.typescriptlang.org/)** — tipagem estática
- **[Tailwind CSS](https://tailwindcss.com/)** — estilização utilitária
- **[shadcn/ui](https://ui.shadcn.com/)** — componentes de UI (Input, Label, Button, Select, RadioGroup)
- **[React Hook Form](https://react-hook-form.com/)** — gerenciamento de formulário
- **[Zod](https://zod.dev/)** — validação de schema
- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)** — integração Zod + React Hook Form

## Como rodar

```bash
npm install
npm run dev -- -p 3000
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Integração com Google Sheets

Os dados do formulário são enviados automaticamente para uma planilha do Google via Apps Script.

### 1. Crie a planilha

Acesse [sheets.google.com](https://sheets.google.com) e crie uma planilha em branco. Sugestão de nome: **Apoiadores Pithon**.

### 2. Abra o Apps Script

Na planilha, clique em **Extensões → Apps Script**.

### 3. Cole o script

Apague tudo que estiver no editor e cole o seguinte código:

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
    data.dataHora,
    data.nome,
    data.email,
    data.whatsapp,
    data.dataNascimento,
    data.endereco,
    data.bairro,
    data.cidade,
    data.estado,
    data.engajamento,
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Clique em **Salvar** (ícone de disquete).

### 4. Publique como Web App

1. Clique em **Implantar → Nova implantação**
2. Clique no ícone de engrenagem ao lado de "Tipo" e selecione **App da Web**
3. Configure:
   - **Executar como:** Eu (seu e-mail)
   - **Quem pode acessar:** Qualquer pessoa
4. Clique em **Implantar** e autorize o acesso quando solicitado
5. **Copie a URL** gerada (começa com `https://script.google.com/macros/s/...`)

### 5. Configure o ambiente

Crie ou edite o arquivo `.env.local` na raiz do projeto:

```env
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/SEU_ID_AQUI/exec
```

### 6. Reinicie o servidor

```bash
npm run dev -- -p 3000
```

A partir daí, cada envio do formulário adiciona uma linha na planilha com todos os dados do apoiador.
