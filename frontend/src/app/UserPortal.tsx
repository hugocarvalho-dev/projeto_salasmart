import { useState } from "react";
import { LogOut, ClipboardList, ChevronDown, Package, Users, Settings, Menu } from "lucide-react";
import { useNavigate } from "react-router";
import ProductsSection from "./ProductsSection";
import TeamSection from "./TeamSection";
import SettingsSection from "./SettingsSection";
import OrdersSection from "./OrdersSection";

import { useAuth } from "./auth";
import logoWhite from "../assets/logo-white.svg";

type Section = "pedidos" | "produtos" | "equipe" | "configuracoes";

const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

const roleLabel = (): string => "Administrador";

const NAV_GESTAO = [
  { id: "pedidos", label: "Pedidos", icon: ClipboardList },
  { id: "produtos", label: "Produtos", icon: Package },
  { id: "equipe", label: "Equipe", icon: Users },
  { id: "configuracoes", label: "Configurações", icon: Settings },
] as const;

export default function UserPortal() {
  const navigate = useNavigate();
  const { user: authUser, signOut } = useAuth();

  const identity = authUser
    ? {
        name: authUser.name,
        initials: initialsFromName(authUser.name),
        subtitle: roleLabel(),
      }
    : { name: "", initials: "?", subtitle: "" };

  const handleSair = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const NAV = NAV_GESTAO;
  const [section, setSection] = useState<Section>("pedidos");

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const userMenu = (
    <div className="relative">
      <button
        onClick={() => setUserMenuOpen((o) => !o)}
        className="flex items-center gap-3 bg-white rounded-full pl-2 pr-3 py-1.5 shadow-sm hover:shadow transition-all"
      >
        <div className="w-9 h-9 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
          {identity.initials}
        </div>
        <div className="min-w-0 text-left">
          <p className="text-[#1a1a1a] font-bold text-sm leading-tight truncate">{identity.name}</p>
          <p className="text-[#9b9b9b] text-xs font-medium leading-tight">{identity.subtitle}</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#9b9b9b] transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
        />
      </button>

      {userMenuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#f0eeeb] py-1.5 z-20">
            <button
              onClick={() => void handleSair()}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-[#1a1a1a] hover:bg-[#f5f3f0] transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-[#2563EB]" />
              Sair
            </button>
          </div>
        </>
      )}
    </div>
  );

  const headerRight = <div className="flex items-center gap-3">{userMenu}</div>;

  const userMenuMobile = (
    <div>
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="w-9 h-9 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-black text-sm flex-shrink-0">
          {identity.initials}
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-tight truncate">{identity.name}</p>
          <p className="text-white/50 text-xs font-medium leading-tight truncate">
            {identity.subtitle}
          </p>
        </div>
      </div>
      <button
        onClick={() => void handleSair()}
        className="w-full mt-1.5 flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold text-white/70 hover:bg-white/10 transition-colors"
      >
        <LogOut className="w-4 h-4 text-[#2563EB]" /> Sair
      </button>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-[#f0eeeb]">
      {mobileNavOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside
        style={{ left: mobileNavOpen ? 0 : "-16rem" }}
        className={`fixed lg:static inset-y-0 w-64 lg:w-60 flex-shrink-0 bg-[#1a1a1a] flex flex-col z-50`}
      >
        <div className="px-5 pt-7 pb-6 border-b border-white/10 flex justify-center">
          <img src={logoWhite} alt="SalaSmart" className="h-16 w-auto" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSection(item.id as Section);
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                  active
                    ? "bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/30"
                    : "text-white/50 hover:text-white hover:bg-white/8"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="lg:hidden border-t border-white/10 p-3">{userMenuMobile}</div>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <div className="lg:hidden sticky top-0 z-30 bg-[#1a1a1a] flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="w-10 h-10 -ml-2 flex items-center justify-center text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="w-10 h-10 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-black text-sm">
            {identity.initials}
          </div>
        </div>

        {section === "pedidos" && (
          <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
            <div className="hidden lg:flex justify-end mb-5">{headerRight}</div>
            <OrdersSection />
          </div>
        )}

        {section === "produtos" && (
          <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
            <div className="hidden lg:flex justify-end mb-5">{headerRight}</div>
            <ProductsSection />
          </div>
        )}

        {section === "equipe" && (
          <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
            <div className="hidden lg:flex justify-end mb-5">{headerRight}</div>
            <TeamSection />
          </div>
        )}

        {section === "configuracoes" && (
          <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
            <div className="hidden lg:flex justify-end mb-5">{headerRight}</div>
            <SettingsSection />
          </div>
        )}
      </main>
    </div>
  );
}
