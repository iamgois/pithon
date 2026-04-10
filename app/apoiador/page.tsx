"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { Play } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const schema = z
  .object({
    nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmarSenha: z.string().min(1, "Confirme sua senha"),
    whatsapp: z.string().min(10, "WhatsApp inválido"),
    cidade: z.string().min(2, "Cidade obrigatória"),
    bairro: z.string().min(2, "Bairro obrigatório"),
    profissao: z.string().optional(),
    dataNascimento: z.string().min(1, "Data de nascimento obrigatória"),
    nivelApoio: z.string().min(1, "Selecione seu nível de apoio"),
    canalComunicacao: z.string().min(1, "Selecione o canal preferido"),
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

type FormData = z.infer<typeof schema>;

const ASSUNTOS = ["Segurança", "Saúde", "Educação", "Transporte", "Emprego", "Outros"];
const HOBBIES = ["Academia", "Tiro Esportivo", "Motociclismo", "Bike", "Futebol", "Outros"];

const NIVEL_APOIO = [
  {
    value: "simpatizante",
    label: "Quero conhecer mais",
    titulo: "Simpatizante",
    color: "border-blue-500 bg-blue-500/10",
    dot: "bg-blue-500",
  },
  {
    value: "recruta",
    label: "Conte com meu apoio",
    titulo: "Recruta",
    color: "border-orange-500 bg-orange-500/10",
    dot: "bg-orange-500",
  },
  {
    value: "operador_especial",
    label: "Conte com meu apoio + quero ajudar",
    titulo: "Operador Especial",
    color: "border-red-500 bg-red-500/10",
    dot: "bg-red-500",
  },
];

const CANAIS = ["Instagram", "WhatsApp", "Ligação", "Outros"];

function formatWhatsApp(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ToggleChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
        selected
          ? "border-primary bg-primary/15 text-foreground"
          : "border-zinc-700 text-muted-foreground hover:border-zinc-500"
      }`}
    >
      {label}
    </button>
  );
}

const VIDEO_URL = "https://euk6y5si9i.ufs.sh/f/CpZyWbPiOXoNUJP0fCmgLZXSxvo8h2MHPnRrWBCzqeJ6mul1";

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [submittedName, setSubmittedName] = useState("");
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [assuntos, setAssuntos] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [hobbyOutro, setHobbyOutro] = useState("");
  const [canalDetalhe, setCanalDetalhe] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const whatsappValue = watch("whatsapp", "");
  const nivelApoioValue = watch("nivelApoio", "");
  const canalValue = watch("canalComunicacao", "");

  function handleWhatsAppChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue("whatsapp", formatWhatsApp(e.target.value), { shouldValidate: true });
  }

  function toggleAssunto(a: string) {
    setAssuntos((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  }

  function toggleHobby(h: string) {
    setHobbies((prev) => prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]);
  }

  async function onSubmit(data: FormData) {
    setSubmitError(null);

    const res = await fetch("/api/apoiador", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        telefone: data.whatsapp,
        dataNascimento: data.dataNascimento,
        cidade: data.cidade,
        bairro: data.bairro,
        profissao: data.profissao || null,
        assuntosInteresse: assuntos.length > 0 ? assuntos.join(", ") : null,
        hobbies: hobbies.length > 0
          ? hobbies.map((h) => h === "Outros" && hobbyOutro ? `Outros (${hobbyOutro})` : h).join(", ")
          : null,
        nivelApoio: data.nivelApoio,
        canalComunicacao: canalDetalhe
          ? `${data.canalComunicacao} (${canalDetalhe})`
          : data.canalComunicacao,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setSubmitError(err.error || "Erro ao enviar. Tente novamente.");
      return;
    }

    const { link } = await res.json();
    setSubmittedName(data.nome.split(" ")[0]);
    setReferralLink(link);
    setSubmitted(true);
    reset();
    setAssuntos([]);
    setHobbies([]);
    setHobbyOutro("");
    setCanalDetalhe("");
  }

  async function handleCopyLink() {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-[420px] text-center gap-6 py-10 px-6">
          <div className="text-5xl">🎉</div>
          <div className="flex flex-col gap-2">
            <CardTitle className="text-xl">Obrigado pelo apoio, {submittedName}!</CardTitle>
            <CardDescription>Juntos seremos mais fortes!</CardDescription>
          </div>

          {referralLink && (
            <div className="flex flex-col gap-3 p-4 rounded-lg border bg-muted/40">
              <p className="text-sm font-medium">Seu link de indicação:</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={referralLink}
                  className="text-xs"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button size="sm" variant="outline" onClick={handleCopyLink} className="shrink-0">
                  {copied ? "Copiado!" : "Copiar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Compartilhe e acompanhe suas indicações no{" "}
                <a
                  href={`/dashboard/${referralLink.split("ref=")[1]}`}
                  className="underline hover:text-foreground"
                >
                  seu painel
                </a>.
              </p>
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            onClick={() => { setSubmitted(false); setReferralLink(null); setSubmitError(null); }}
          >
            Preencher novamente
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {showVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowVideo(false)}
        >
          <div
            className="flex flex-col items-center gap-4 my-10"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white text-xl font-bold tracking-wide">Assista o Vídeo</p>
            <div className="relative">
              <video
                ref={videoRef}
                src={VIDEO_URL}
                muted={isMuted}
                playsInline
                onEnded={() => setShowVideo(false)}
                className={`w-full md:max-h-[70vh] rounded-xl transition-all duration-300 ${isMuted ? "blur-sm" : ""}`}
              />
              {isMuted && (
                <button
                  onClick={() => {
                    setIsMuted(false);
                    if (videoRef.current) {
                      videoRef.current.muted = false;
                      videoRef.current.play();
                    }
                  }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="w-16 h-16 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white hover:bg-black/80 transition-colors">
                    <Play size={28} fill="white" />
                  </span>
                </button>
              )}
            </div>
            <button
              onClick={() => setShowVideo(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-[420px] flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/pithon.jpg"
            alt="Foto de Pithon"
            width={80}
            height={80}
            className="rounded-full object-cover ring-2 ring-white/20"
          />
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-widest leading-tight">PITHON</h1>
            <a
              href="https://www.instagram.com/pithon_35/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 text-sm hover:text-white transition-colors"
            >
              @pithon_35
            </a>
            <p className="text-zinc-500 text-xs mt-1">A humildade precede a honra</p>
          </div>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Cadastro de Apoiadores</CardTitle>
            <CardDescription>Preencha seus dados abaixo</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="flex flex-col gap-5 pt-5">

              {submitError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                  {submitError}
                </div>
              )}

              <Field label="Nome completo *" error={errors.nome?.message}>
                <Input placeholder="Seu nome completo" {...register("nome")} aria-invalid={!!errors.nome} />
              </Field>

              <Field label="E-mail *" error={errors.email?.message}>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                  autoComplete="email"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Senha *" error={errors.senha?.message}>
                  <Input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    {...register("senha")}
                    aria-invalid={!!errors.senha}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Confirmar senha *" error={errors.confirmarSenha?.message}>
                  <Input
                    type="password"
                    placeholder="Repita a senha"
                    {...register("confirmarSenha")}
                    aria-invalid={!!errors.confirmarSenha}
                    autoComplete="new-password"
                  />
                </Field>
              </div>

              <Field label="WhatsApp *" error={errors.whatsapp?.message}>
                <Input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={whatsappValue}
                  onChange={handleWhatsAppChange}
                  aria-invalid={!!errors.whatsapp}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Cidade *" error={errors.cidade?.message}>
                  <Input placeholder="Sua cidade" {...register("cidade")} aria-invalid={!!errors.cidade} />
                </Field>
                <Field label="Bairro *" error={errors.bairro?.message}>
                  <Input placeholder="Seu bairro" {...register("bairro")} aria-invalid={!!errors.bairro} />
                </Field>
              </div>

              <Field label="Profissão (opcional)">
                <Input placeholder="Ex: Policial, Professor, Comerciante..." {...register("profissao")} />
              </Field>

              <Field label="Data de nascimento *" error={errors.dataNascimento?.message}>
                <Input type="date" {...register("dataNascimento")} aria-invalid={!!errors.dataNascimento} />
              </Field>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Assuntos de interesse
                </Label>
                <div className="flex flex-wrap gap-2">
                  {ASSUNTOS.map((a) => (
                    <ToggleChip key={a} label={a} selected={assuntos.includes(a)} onToggle={() => toggleAssunto(a)} />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Hobby
                </Label>
                <div className="flex flex-wrap gap-2">
                  {HOBBIES.map((h) => (
                    <ToggleChip key={h} label={h} selected={hobbies.includes(h)} onToggle={() => toggleHobby(h)} />
                  ))}
                </div>
                {hobbies.includes("Outros") && (
                  <Input
                    placeholder="Qual seu hobby?"
                    value={hobbyOutro}
                    onChange={(e) => setHobbyOutro(e.target.value)}
                    className="mt-1"
                  />
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Nível de apoio *
                </Label>
                <RadioGroup
                  value={nivelApoioValue}
                  onValueChange={(val: string | null) => setValue("nivelApoio", val ?? "", { shouldValidate: true })}
                  className="gap-2"
                >
                  {NIVEL_APOIO.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                        nivelApoioValue === opt.value ? opt.color : "border-border hover:border-zinc-600"
                      }`}
                    >
                      <RadioGroupItem value={opt.value} className="shrink-0" />
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.dot}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-none">{opt.titulo}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.label}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
                {errors.nivelApoio && <p className="text-xs text-destructive">{errors.nivelApoio.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Melhor canal para falarmos com você *
                </Label>
                <RadioGroup
                  value={canalValue}
                  onValueChange={(val: string | null) => { setValue("canalComunicacao", val ?? "", { shouldValidate: true }); setCanalDetalhe(""); }}
                  className="grid grid-cols-2 gap-2"
                >
                  {CANAIS.map((canal) => (
                    <label
                      key={canal}
                      className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 cursor-pointer transition-colors ${
                        canalValue === canal ? "border-primary bg-primary/10" : "border-border hover:border-zinc-600"
                      }`}
                    >
                      <RadioGroupItem value={canal} className="shrink-0" />
                      <span className="text-sm">{canal}</span>
                    </label>
                  ))}
                </RadioGroup>
                {errors.canalComunicacao && <p className="text-xs text-destructive">{errors.canalComunicacao.message}</p>}
                {canalValue === "Instagram" && (
                  <Input
                    placeholder="Seu @ do Instagram"
                    value={canalDetalhe}
                    onChange={(e) => setCanalDetalhe(e.target.value)}
                  />
                )}
                {canalValue === "Ligação" && (
                  <Input
                    type="tel"
                    placeholder="Número para ligação"
                    value={canalDetalhe}
                    onChange={(e) => setCanalDetalhe(e.target.value)}
                  />
                )}
                {canalValue === "Outros" && (
                  <Input
                    placeholder="Como prefere ser contactado? (ex: e-mail, Telegram...)"
                    value={canalDetalhe}
                    onChange={(e) => setCanalDetalhe(e.target.value)}
                  />
                )}
              </div>

            </CardContent>

            <CardFooter className="flex-col gap-3 pt-2">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full font-semibold"
              >
                {isSubmitting ? "Enviando..." : "Quero Apoiar Pithon →"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Seus dados estão seguros e não serão compartilhados.
              </p>
            </CardFooter>
          </form>
        </Card>

        <Image
          src="/topo-imagem.png"
          alt="Banner"
          width={420}
          height={200}
          className="w-full h-auto object-cover rounded-xl"
        />
      </div>
    </div>
  );
}
