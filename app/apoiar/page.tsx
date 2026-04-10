"use client";

import Image from "next/image";
import { useState, useEffect, useRef, Suspense } from "react";
import { VolumeX } from "lucide-react";
import { useSearchParams } from "next/navigation";
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

const schema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().min(10, "WhatsApp inválido"),
});

type FormData = z.infer<typeof schema>;

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

const VIDEO_URL = "https://euk6y5si9i.ufs.sh/f/CpZyWbPiOXoNUJP0fCmgLZXSxvo8h2MHPnRrWBCzqeJ6mul1";

function RefCodeSetter() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      document.cookie = `ref_code=${ref}; path=/; max-age=86400; SameSite=Lax`;
    }
  }, [searchParams]);
  return null;
}

export default function ApoiarPage() {
  const [submitted, setSubmitted] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [submittedName, setSubmittedName] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const telefoneValue = watch("telefone", "");

  function handleTelefoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue("telefone", formatWhatsApp(e.target.value), { shouldValidate: true });
  }

  async function onSubmit(data: FormData) {
    setSubmitError(null);

    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        intencaoVoto: "sim",
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setSubmitError(res.status === 409 ? "Este e-mail já está cadastrado." : (err.error || "Erro ao enviar. Tente novamente."));
      return;
    }

    setSubmittedName(data.nome.split(" ")[0]);
    setSubmitted(true);
    reset();
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-[420px] text-center gap-6 py-10 px-6">
          <div className="text-5xl">🎉</div>
          <div className="flex flex-col gap-2">
            <CardTitle className="text-xl">Obrigado, {submittedName}!</CardTitle>
            <CardDescription>
              Seu apoio foi registrado. Juntos pelo Pithon!
            </CardDescription>
          </div>
          <Button
            size="lg"
            className="w-full bg-[#1a1a1a] hover:bg-[#333] text-white"
            onClick={() => { setSubmitted(false); setSubmitError(null); }}
          >
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense fallback={null}>
        <RefCodeSetter />
      </Suspense>
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
            <CardTitle>Declarar Apoio</CardTitle>
            <CardDescription>Um amigo te indicou. Deixe seu apoio ao Pithon!</CardDescription>
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

              <Field label="WhatsApp *" error={errors.telefone?.message}>
                <Input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={telefoneValue}
                  onChange={handleTelefoneChange}
                  aria-invalid={!!errors.telefone}
                />
              </Field>

            </CardContent>

            <CardFooter className="flex-col gap-3 pt-2">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full font-semibold"
              >
                {isSubmitting ? "Enviando..." : "Apoiar Pithon →"}
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
