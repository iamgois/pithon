import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HandRaisedIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
          <Link
            href="/apoiador"
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            <HandRaisedIcon data-icon="inline-start" className="size-4" />
            Me identifico com o projeto
          </Link>

          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
          >
            <ArrowRightOnRectangleIcon data-icon="inline-start" className="size-4" />
            Login
          </Link>
        </div>

      </div>
    </div>
  );
}
