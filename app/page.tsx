import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] flex flex-col items-center gap-8">

        <Image
          src="/topo-imagem.png"
          alt="Banner"
          width={420}
          height={200}
          className="w-full h-auto object-cover rounded-xl"
          priority
        />

        <div className="flex flex-col items-center gap-1 text-center">
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

        <div className="w-full flex flex-col gap-3">
          <Button
            asChild
            size="lg"
            className="w-full bg-white text-[#1a1a1a] hover:bg-zinc-100 font-semibold h-14 text-base"
          >
            <Link href="/apoiador">Quero ser Apoiador</Link>
          </Button>

          <Button
            asChild
            size="lg"
            className="w-full bg-white text-[#1a1a1a] hover:bg-zinc-100 font-semibold h-14 text-base"
          >
            <Link href="/admin">Painel Administrativo</Link>
          </Button>
        </div>

      </div>
    </div>
  );
}
