import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { User, Lock } from "lucide-react";
import bgLogin from "../assets/bk_login.jpg";
import logoWhite from "../assets/logo-white.svg";
import { ApiError, loginWithPassword, type AuthUser } from "../api/portal";
import { useAuth } from "./auth";
import { hasManagementRole } from "./RequireAuth";

const homeFor = (u: AuthUser): "/gestao" | "/" =>
  hasManagementRole(u) ? "/gestao" : "/";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate(homeFor(user), { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { user: logged } = await loginWithPassword(username.trim(), password);
      setUser(logged);
      navigate(homeFor(logged), { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Não foi possível entrar. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      <div className="relative lg:w-[60%] min-h-[280px] lg:min-h-screen flex flex-col overflow-hidden">
        <img
          src={bgLogin}
          alt="Ambiente da sala de reunião"
          className="absolute inset-0 w-full h-full object-cover animate-ken-burns"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/70" />
        <div className="relative z-10 flex flex-col px-8 sm:px-12 pt-10">
          <img
            src={logoWhite}
            alt="SalaSmart"
            className="w-28 sm:w-32 lg:w-36 h-auto drop-shadow-lg"
          />
        </div>
      </div>

      <div className="lg:w-[40%] flex-1 flex items-center justify-center px-6 sm:px-10 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <p className="text-[#2563EB] font-black text-sm uppercase tracking-widest mb-2">
              ACESSO ADMINISTRADOR
            </p>
            <h1 className="text-[#1a1a1a] font-black text-3xl sm:text-4xl leading-tight">
              Salas de Reunião
            </h1>
            <p className="text-[#6b6b6b] font-medium text-base mt-2">
              Entre com seu usuário e senha para acessar o painel de gestão.
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#1a1a1a] mb-1.5">Usuário</label>
              <div className="relative">
                <User className="w-5 h-5 text-[#c0c0c0] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="w-full bg-[#f7f5f2] border-2 border-transparent focus:border-[#2563EB] focus:bg-white rounded-2xl pl-12 pr-4 py-3.5 text-base font-semibold text-[#1a1a1a] outline-none transition-all placeholder:text-[#c0c0c0] placeholder:font-normal"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1a1a1a] mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-[#c0c0c0] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  autoComplete="current-password"
                  className="w-full bg-[#f7f5f2] border-2 border-transparent focus:border-[#2563EB] focus:bg-white rounded-2xl pl-12 pr-4 py-3.5 text-base font-semibold text-[#1a1a1a] outline-none transition-all placeholder:text-[#c0c0c0] placeholder:font-normal"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || !username.trim() || !password}
              className={`w-full py-3.5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2.5 ${
                busy || !username.trim() || !password
                  ? "bg-[#e8e6e2] text-[#b0b0b0] cursor-not-allowed"
                  : "bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] shadow-lg shadow-[#2563EB]/25"
              }`}
            >
              {busy ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#e8e6e2]" />
            <span className="text-[#9b9b9b] text-xs font-bold uppercase tracking-wide">
              Acesso exclusivo SalaSmart
            </span>
            <div className="flex-1 h-px bg-[#e8e6e2]" />
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full mt-1 text-[#6b6b6b] hover:text-[#2563EB] font-bold text-sm transition-colors"
          >
            Voltar às salas
          </button>
        </div>
      </div>
    </div>
  );
}
