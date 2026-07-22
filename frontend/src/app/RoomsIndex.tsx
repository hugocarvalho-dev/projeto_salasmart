import { Link } from "react-router";
import logoWhite from "../assets/logo-white.svg";
import bgHome from "../assets/bk_home.webp";
import { ROOMS } from "./rooms";

export default function RoomsIndex() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0">
        <img src={bgHome} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#1a1a1a]/85" />
      </div>

      <div className="relative z-10 w-full max-w-2xl text-center">
        <img src={logoWhite} alt="SalaSmart" className="h-16 sm:h-20 mx-auto" />
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-8">Salas de Reunião</h1>
        <p className="text-white/60 font-medium mt-2">Selecione a sala para abrir o menu.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-10">
          {ROOMS.map((r) => (
            <Link
              key={r.slug}
              to={`/${r.slug}`}
              className="bg-white/10 hover:bg-[#2563EB] border border-white/15 rounded-2xl py-6 text-white font-black text-lg transition-all active:scale-95"
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
