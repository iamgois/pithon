"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { VolumeX } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const schema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  whatsapp: z.string().min(10, "WhatsApp inválido"),
  dataNascimento: z.string().min(1, "Data de nascimento obrigatória"),
  endereco: z.string().min(5, "Endereço obrigatório"),
  bairro: z.string().min(2, "Bairro obrigatório"),
  cidade: z.string().min(2, "Cidade obrigatória"),
  estado: z.string().min(2, "Estado obrigatório"),
  engajamento: z.string().min(1, "Selecione seu nível de engajamento"),
});

type FormData = z.infer<typeof schema>;

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO",
];

const ENGAJAMENTO_OPTIONS = [
  { value: "conhecer",      label: "Quero conhecer mais informações" },
  { value: "avaliando",     label: "Já conheço Pithon, estou avaliando se dou meu apoio a ele" },
  { value: "apoio",         label: "Estou com Pithon! Pode contar com meu apoio" },
  { value: "apoio_e_indica",label: "Estou com Pithon! Pode contar com meu apoio e quero ajudar indicando mais gente" },
];

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

const VIDEO_URL = "https://euk6y5si9i.ufs.sh/f/CpZyWbPiOXoNKdQ1IOsWUxVD1RCQngBokYcSH4htGAmM9bys";

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [submittedName, setSubmittedName] = useState("");
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const whatsappValue = watch("whatsapp", "");
  const engajamentoValue = watch("engajamento", "");

  function handleWhatsAppChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue("whatsapp", formatWhatsApp(e.target.value), { shouldValidate: true });
  }

  async function onSubmit(data: FormData) {
    setSubmitError(null);

    const res = await fetch("/api/apoiador", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: data.nome,
        email: data.email,
        telefone: data.whatsapp,
        dataNascimento: data.dataNascimento,
        endereco: data.endereco,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        engajamento: data.engajamento,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setSubmitError(res.status === 409 ? "Este e-mail já está cadastrado." : (err.error || "Erro ao enviar. Tente novamente."));
      return;
    }

    const { link } = await res.json();
    setSubmittedName(data.nome.split(" ")[0]);
    setReferralLink(link);
    setSubmitted(true);
    reset();
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
            <p className="text-white text-xl font-bold tracking-wide">Receba este chamado</p>
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
                    <VolumeX size={28} />
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
            <CardContent className="flex flex-col gap-4 pt-5">

              {submitError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                  {submitError}
                </div>
              )}

              <Field label="Nome completo *" error={errors.nome?.message}>
                <Input placeholder="Seu nome completo" {...register("nome")} aria-invalid={!!errors.nome} />
              </Field>

              <Field label="E-mail *" error={errors.email?.message}>
                <Input type="email" placeholder="seu@email.com" {...register("email")} aria-invalid={!!errors.email} />
              </Field>

              <Field label="WhatsApp *" error={errors.whatsapp?.message}>
                <Input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={whatsappValue}
                  onChange={handleWhatsAppChange}
                  aria-invalid={!!errors.whatsapp}
                />
              </Field>

              <Field label="Data de nascimento *" error={errors.dataNascimento?.message}>
                <Input type="date" {...register("dataNascimento")} aria-invalid={!!errors.dataNascimento} />
              </Field>

              <Field label="Endereço *" error={errors.endereco?.message}>
                <Input placeholder="Rua, número, complemento" {...register("endereco")} aria-invalid={!!errors.endereco} />
              </Field>

              <Field label="Bairro *" error={errors.bairro?.message}>
                <Input placeholder="Seu bairro" {...register("bairro")} aria-invalid={!!errors.bairro} />
              </Field>

              <div className="grid grid-cols-[1fr_auto] gap-3">
                <Field label="Cidade *" error={errors.cidade?.message}>
                  <Input placeholder="Sua cidade" {...register("cidade")} aria-invalid={!!errors.cidade} />
                </Field>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado *</Label>
                  <Select onValueChange={(val: string | null) => setValue("estado", val ?? "", { shouldValidate: true })}>
                    <SelectTrigger className="w-[72px]" aria-invalid={!!errors.estado}>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.estado && <p className="text-xs text-destructive">{errors.estado.message}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Nível de engajamento *
                </Label>
                <RadioGroup
                  value={engajamentoValue}
                  onValueChange={(val: string | null) => setValue("engajamento", val ?? "", { shouldValidate: true })}
                  className="gap-2"
                >
                  {ENGAJAMENTO_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                        engajamentoValue === opt.value ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <RadioGroupItem value={opt.value} className="mt-0.5 shrink-0" />
                      <span className="text-sm leading-snug text-foreground">{opt.label}</span>
                    </label>
                  ))}
                </RadioGroup>
                {errors.engajamento && <p className="text-xs text-destructive">{errors.engajamento.message}</p>}
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
