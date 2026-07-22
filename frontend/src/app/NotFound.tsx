import { Link } from "react-router";
import logoWhite from "../assets/logo-white.svg";
import bgHome from "../assets/bk_home.webp";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0">
        <img src={bgHome} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#1a1a1a]/85" />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        <img src={logoWhite} alt="SalaSmart" className="h-14 sm:h-16 mx-auto" />

        <p className="text-[#2563EB] font-black text-6xl sm:text-7xl tracking-tight mt-10 leading-none">
          404
        </p>

        <h1 className="text-2xl sm:text-3xl font-black text-white mt-6">
          Página não encontrada
        </h1>
        <p className="text-white/60 font-medium mt-3 max-w-sm mx-auto">
          A página que você tentou acessar não existe ou foi movida.
        </p>

        <Link
          to="/"
          className="inline-block mt-10 bg-[#2563EB] hover:bg-[#1D4ED8] border border-white/10 rounded-2xl px-8 py-4 text-white font-black text-base transition-all active:scale-95"
        >
          Ir para a tela inicial
        </Link>
      </div>
    </div>
  );
}
