import { useState, useEffect, useRef, useMemo } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Check,
  ArrowLeft,
  ChevronDown,
  User,
  Wifi,
  BatteryCharging,
  Monitor,
  Wind,
  Info,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import logoWhite from "../assets/logo-white.svg";
import bgHome from "../assets/bk_home.webp";
import catAgua from "../assets/products/category_agua.webp";
import catCafe from "../assets/products/category_cafe.webp";
import catChas from "../assets/products/category_chas.webp";
import catSnacks from "../assets/products/category_snacks.webp";
import { createPurchase } from "../api/portal";
import { useProducts, useCategories } from "../hooks/queries";
import { ApiErrorState } from "./ApiState";
import { byCategoryThenName, byName } from "../lib/sort";
import { MAX_QTY_PER_ITEM } from "./portalData";

type Screen = "home" | "checkout" | "thankyou";

interface Product {
  id: number;
  name: string;
  category: string;
  unit: string;
}

interface CartItem {
  product: Product;
  qty: number;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const imageForCategory = (category: string): string | null => {
  const c = norm(category);
  if (c.includes("agua")) return catAgua;
  if (c.includes("caf")) return catCafe;
  if (c.includes("cha")) return catChas;
  if (c.includes("snack")) return catSnacks;
  return null;
};

const greetingForHour = (hour: number): string => {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
};

export default function App({ room }: { room: string }) {
  const [screen, setScreen] = useState<Screen>("home");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [productQty, setProductQty] = useState<Record<number, number>>({});
  const [customerName, setCustomerName] = useState("");

  const productsQ = useProducts();
  const categoriesQ = useCategories();

  const products = useMemo<Product[]>(
    () =>
      (productsQ.data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        unit: p.unit,
      })),
    [productsQ.data],
  );
  const categories = [...(categoriesQ.data ?? [])].sort(byName);
  const catalogError = productsQ.error;
  const catalogLoading = productsQ.isLoading;
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [heroVisible, setHeroVisible] = useState(true);

  const productsRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  const greeting = useMemo(() => greetingForHour(new Date().getHours()), []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    if (activeCategory === "" && (categoriesQ.data?.length ?? 0) > 0) {
      setActiveCategory([...categoriesQ.data!].sort(byName)[0]);
    }
  }, [categoriesQ.data, activeCategory]);

  useEffect(() => {
    if (screen !== "home") return;
    const obs = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), {
      threshold: 0.05,
    });
    if (heroRef.current) obs.observe(heroRef.current);
    return () => obs.disconnect();
  }, [screen]);

  const adjustQty = (id: number, delta: number) =>
    setProductQty((prev) => ({
      ...prev,
      [id]: Math.min(MAX_QTY_PER_ITEM, Math.max(1, (prev[id] ?? 1) + delta)),
    }));

  const addToCart = (product: Product) => {
    const qty = productQty[product.id] ?? 1;
    setCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id);
      return ex
        ? prev.map((i) =>
            i.product.id === product.id
              ? { ...i, qty: Math.min(MAX_QTY_PER_ITEM, i.qty + qty) }
              : i,
          )
        : [...prev, { product, qty }];
    });
    setProductQty((prev) => ({ ...prev, [product.id]: 1 }));

    toast.custom(
      () => (
        <div className="mx-auto flex items-center gap-3 bg-white rounded-2xl shadow-xl border border-[#f0eeeb] px-4 py-3 w-[340px] max-w-[86vw]">
          <div className="flex-1 min-w-0">
            <p className="font-black text-[#1a1a1a] text-sm leading-tight">
              Adicionado ao carrinho
            </p>
            <p className="text-[#6b6b6b] text-xs font-semibold mt-0.5 truncate">
              {qty}× {product.name}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
        </div>
      ),
      { duration: 2500 },
    );
  };

  const cartAdjust = (id: number, qty: number) => {
    if (qty <= 0) setCart((prev) => prev.filter((i) => i.product.id !== id));
    else {
      const capped = Math.min(qty, MAX_QTY_PER_ITEM);
      setCart((prev) => prev.map((i) => (i.product.id === id ? { ...i, qty: capped } : i)));
    }
  };

  const canConfirm = !submitting && cart.length > 0 && customerName.trim().length >= 2;

  const resetAll = () => {
    setCart([]);
    setCustomerName("");
    setProductQty({});
    setActiveCategory("");
    setScreen("home");
    setHeroVisible(true);
  };

  const confirmOrder = async () => {
    if (!canConfirm) return;

    setSubmitting(true);
    try {
      await createPurchase({
        customerName: customerName.trim(),
        room,
        items: cart.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          qty: i.qty,
        })),
      });

      setScreen("thankyou");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível finalizar o pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (screen !== "thankyou") return;
    setCountdown(10);
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          resetAll();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [screen]);

  const filtered = (
    activeCategory === "" ? [] : products.filter((p) => p.category === activeCategory)
  )
    .slice()
    .sort(byCategoryThenName);

  if (screen === "thankyou") {
    return (
      <div className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-[#1a1a1a]">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={bgHome}
            alt="Ambiente da sala de reunião"
            className="w-full h-full object-cover animate-ken-burns"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
        </div>

        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs sm:text-sm font-bold rounded-full px-4 py-1.5">
            {room}
          </span>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-7 px-8 text-center">
          <div className="relative flex items-center justify-center animate-in zoom-in duration-500">
            <span className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#2563EB]/25 animate-ping" />
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#2563EB] flex items-center justify-center shadow-2xl shadow-[#2563EB]/40">
              <Check className="w-14 h-14 sm:w-16 sm:h-16 text-white" strokeWidth={3} />
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:150ms]">
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">Tudo certo!</h1>
            <p className="mt-4 text-lg sm:text-xl text-white/65 font-medium max-w-md leading-relaxed">
              Aguarde que logo levaremos seu pedido até você.
            </p>
            <div className="mt-5 inline-flex items-center gap-2.5 bg-white/10 border border-white/15 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span className="text-white/80 font-bold text-sm">
                {cartCount} {cartCount === 1 ? "item" : "itens"} a caminho
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-700 [animation-delay:300ms]">
            <div className="flex items-center gap-4 bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl pl-4 pr-6 py-3.5">
              <div className="relative w-14 h-14 flex-shrink-0">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 24}
                    strokeDashoffset={2 * Math.PI * 24 * (1 - countdown / 10)}
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-white font-black text-lg">
                  {countdown}
                </span>
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-sm leading-tight">Voltando à tela inicial</p>
                <p className="text-white/50 text-xs font-medium mt-0.5">
                  Em {countdown} segundo{countdown === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={resetAll}
                style={{ touchAction: "manipulation" }}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white font-bold text-sm px-6 py-3 rounded-full transition-all active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao início
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "checkout") {
    return (
      <div className="h-screen flex flex-col bg-[#f0eeeb] overflow-hidden">
        <Toaster position="top-center" offset={16} />
        <header className="bg-[#1a1a1a] px-4 sm:px-8 py-3.5 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setScreen("home")}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors font-bold text-sm rounded-full pl-3 pr-4 py-2"
            style={{ touchAction: "manipulation" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <img src={logoWhite} alt="SalaSmart" className="h-10 sm:h-12" />
          <span className="bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs sm:text-sm font-bold rounded-full px-3.5 py-1.5">
            {room}
          </span>
        </header>

        <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:grid lg:grid-cols-[1fr_420px] gap-0">
          <div className="lg:overflow-y-auto px-5 sm:px-8 py-7 sm:py-10 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="max-w-xl mx-auto lg:mx-0">
              <p className="text-[#2563EB] font-black text-xs uppercase tracking-[0.2em]">Quase lá</p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1a1a1a] mt-1.5 mb-6 leading-tight">
                Finalizar pedido
              </h2>

              <div className="bg-white rounded-3xl border border-[#f0eeeb] shadow-sm p-6 sm:p-7">
                <div className="flex items-start gap-3.5 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#1a1a1a] leading-tight">
                      Quem está pedindo?
                    </h3>
                    <p className="text-[#6b6b6b] text-sm font-medium mt-1 leading-relaxed">
                      Informe o nome para identificarmos o seu pedido.
                    </p>
                  </div>
                </div>

                <label className="block text-sm font-bold text-[#1a1a1a] mb-2">Nome</label>
                <div className="relative">
                  <User className="w-5 h-5 text-[#c0c0c0] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && canConfirm && void confirmOrder()}
                    placeholder="Digite o nome…"
                    autoComplete="off"
                    autoFocus
                    className="w-full bg-[#f7f5f2] border-2 border-transparent focus:border-[#2563EB] focus:bg-white rounded-2xl pl-12 pr-4 py-3.5 text-base font-semibold text-[#1a1a1a] outline-none transition-all placeholder:text-[#c0c0c0] placeholder:font-normal"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t lg:border-t-0 lg:border-l border-[#e8e6e2] bg-white flex flex-col lg:overflow-hidden">
            <div className="px-6 pt-6 pb-3 flex-shrink-0">
              <p className="text-[#2563EB] font-black text-[11px] uppercase tracking-[0.2em]">
                Resumo
              </p>
              <h2 className="text-lg font-black text-[#1a1a1a] mt-0.5">Seu pedido</h2>
            </div>

            <div className="flex-1 lg:overflow-y-auto px-6">
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 bg-[#f7f5f2] rounded-2xl px-3.5 py-3"
                  >
                    <span className="w-9 h-9 rounded-xl bg-[#2563EB] text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                      {item.qty}
                    </span>
                    <p className="flex-1 min-w-0 font-bold text-[#1a1a1a] text-sm leading-snug truncate">
                      {item.product.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 pt-4 pb-6 border-t border-[#f0eeeb] flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#9b9b9b] font-semibold text-sm">Total de itens</span>
                <span className="font-black text-[#1a1a1a] text-lg">{cartCount}</span>
              </div>
              <button
                onClick={() => void confirmOrder()}
                disabled={!canConfirm}
                style={{ touchAction: "manipulation" }}
                className={`w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2.5 ${
                  canConfirm
                    ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] shadow-lg shadow-[#2563EB]/25"
                    : "bg-[#e8e6e2] text-[#b0b0b0] cursor-not-allowed"
                }`}
              >
                {submitting ? (
                  "Enviando…"
                ) : (
                  <>
                    <Check className="w-5 h-5" strokeWidth={3} />
                    Confirmar pedido
                  </>
                )}
              </button>
              {!submitting && cart.length > 0 && customerName.trim().length < 2 && (
                <p className="text-center text-[#9b9b9b] text-xs font-medium mt-3">
                  Informe o nome acima para confirmar.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0eeeb]">
      <Toaster position="top-center" offset={16} />

      <header
        className={`fixed top-0 left-0 right-0 z-30 bg-[#1a1a1a] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xl transition-transform duration-300 ${
          heroVisible ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="flex items-center gap-3">
          <img src={logoWhite} alt="SalaSmart" className="h-12 sm:h-14" />
          <span className="bg-[#2563EB] text-white text-xs sm:text-sm font-black rounded-full px-3 py-1">
            {room}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCartOpen(true)}
            style={{ touchAction: "manipulation" }}
            className="relative flex items-center gap-2.5 bg-white/10 hover:bg-white/20 transition-all rounded-full px-5 py-2.5 text-white font-bold text-sm border border-white/15"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Carrinho</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-1.5 bg-[#2563EB] text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center shadow">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <section
        ref={heroRef}
        className="relative h-screen flex flex-col"
        style={{ minHeight: 560, maxHeight: 1100 }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <img src={bgHome} alt="Ambiente da sala de reunião" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/85" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 100%)",
            }}
          />
        </div>

        <nav className="relative z-10 flex items-center justify-between px-5 sm:px-8 md:px-10 pt-5 sm:pt-8">
          <div className="flex items-center gap-3">
            <img src={logoWhite} alt="SalaSmart" className="h-9 sm:h-11 w-auto" />
            <span className="bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs sm:text-sm font-bold rounded-full px-3.5 py-1.5">
              {room}
            </span>
          </div>
          <button
            onClick={() => cartCount > 0 && setCartOpen(true)}
            style={{ touchAction: "manipulation" }}
            className="relative flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all rounded-full px-4 sm:px-5 py-2.5 text-white font-bold text-sm sm:text-base border border-white/20"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">Carrinho</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#2563EB] text-white text-xs font-black rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>
        </nav>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 sm:px-8 pb-16">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="inline-flex items-center gap-3 text-white/80 font-bold text-xs sm:text-sm tracking-[0.2em] uppercase">
              <span className="w-7 h-px bg-[#2563EB]" />
              {greeting}
              <span className="w-7 h-px bg-[#2563EB]" />
            </p>
            <h1 className="mt-4 text-white font-black leading-[1.05] text-4xl sm:text-6xl drop-shadow-xl">
              Sua reunião, do seu jeito.
            </h1>
            <p className="mt-5 text-white/75 font-medium text-base sm:text-lg leading-relaxed max-w-md mx-auto">
              Peça cafés, chás, águas e snacks direto da sala. É só escolher que levamos até você.
            </p>
          </div>

          <div className="mt-9 flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs sm:max-w-none sm:w-auto animate-in fade-in slide-in-from-bottom-6 duration-700 [animation-delay:150ms]">
            <button
              onClick={() => productsRef.current?.scrollIntoView({ behavior: "smooth" })}
              style={{ touchAction: "manipulation" }}
              className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black text-base sm:text-lg px-9 py-4 rounded-full transition-all shadow-2xl shadow-[#2563EB]/40 active:scale-95 flex items-center justify-center gap-2.5"
            >
              Ver o cardápio
              <ChevronDown className="w-5 h-5" />
            </button>
            <button
              onClick={() => infoRef.current?.scrollIntoView({ behavior: "smooth" })}
              style={{ touchAction: "manipulation" }}
              className="w-full sm:w-auto bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/25 text-white font-bold text-base sm:text-lg px-9 py-4 rounded-full transition-all active:scale-95 flex items-center justify-center gap-2.5"
            >
              <Info className="w-5 h-5" />
              Informações da sala
            </button>
          </div>
        </div>
      </section>

      <section
        ref={infoRef}
        className="px-4 sm:px-7 pt-16 sm:pt-20 pb-2"
        style={{ scrollMarginTop: 64 }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[#2563EB] font-black text-xs sm:text-sm uppercase tracking-[0.2em]">
              Seja bem-vindo(a)
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-[#1a1a1a] leading-tight">
              Comodidades da sua sala
            </h2>
            <p className="mt-3 text-[#6b6b6b] font-medium text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Um atendimento de excelência começa por um ambiente acolhedor. Abaixo, tudo o que
              você precisa para se sentir bem enquanto estiver conosco.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div className="bg-white rounded-2xl border border-[#f0eeeb] shadow-sm p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center flex-shrink-0">
                  <Wifi className="w-5 h-5" />
                </div>
                <h4 className="font-black text-[#1a1a1a] text-sm">Wi-Fi</h4>
              </div>
              <p className="text-sm text-[#6b6b6b] font-medium">
                Rede: <span className="font-bold text-[#1a1a1a]">SalaSmart_Visitantes</span>
              </p>
              <p className="text-sm text-[#6b6b6b] font-medium mt-1">
                Senha: <span className="font-bold text-[#1a1a1a]">bem-vindo</span>
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#f0eeeb] shadow-sm p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center flex-shrink-0">
                  <BatteryCharging className="w-5 h-5" />
                </div>
                <h4 className="font-black text-[#1a1a1a] text-sm">Carregadores disponíveis</h4>
              </div>
              <ul className="text-sm text-[#6b6b6b] font-medium list-disc pl-5 space-y-1">
                <li>Cabos USB-C e Lightning</li>
                <li>Tomadas e portas USB na mesa</li>
                <li>Carregador por indução sem fio</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-[#f0eeeb] shadow-sm p-5 sm:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center flex-shrink-0">
                  <Wind className="w-5 h-5" />
                </div>
                <h4 className="font-black text-[#1a1a1a] text-sm">Ajustes no ambiente</h4>
              </div>
              <ul className="text-sm text-[#6b6b6b] font-medium space-y-2">
                <li className="flex items-start gap-2">
                  <Wind className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
                  Ajuste a iluminação e a temperatura do ar-condicionado pelo painel na parede.
                </li>
                <li className="flex items-start gap-2">
                  <Monitor className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
                  Para apresentar na TV, conecte-se via cabo HDMI ou compartilhamento de tela sem fio.
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      <section
        ref={productsRef}
        className="px-4 sm:px-7 pb-28"
        style={{ paddingTop: 64, scrollMarginTop: 64 }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center gap-4 mb-6 sm:mb-8">
            <div>
              <p className="text-[#2563EB] font-black text-xs sm:text-sm uppercase tracking-[0.2em]">
                Cardápio
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-black text-[#1a1a1a] leading-tight">
                Escolha o que deseja
              </h2>
              <p className="text-[#6b6b6b] font-medium text-sm mt-2">
                Peça que logo levaremos até você.
              </p>
            </div>
            <div className="flex gap-2.5 sm:gap-8 flex-nowrap sm:flex-wrap justify-center w-full">
              {categories.map((cat) => {
                const img = imageForCategory(cat);
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{ touchAction: "manipulation" }}
                    className="flex flex-col items-center gap-2 group shrink-0"
                  >
                    <span
                      className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden flex items-center justify-center bg-white transition-all ${
                        active
                          ? "ring-4 ring-[#2563EB] shadow-lg shadow-[#2563EB]/25"
                          : "ring-2 ring-[#e8e6e2] group-hover:ring-[#2563EB]/50"
                      }`}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={cat}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[#1a1a1a] font-black text-lg uppercase">
                          {cat.slice(0, 2)}
                        </span>
                      )}
                    </span>
                    <span
                      className={`font-bold text-xs sm:text-sm transition-colors ${
                        active ? "text-[#2563EB]" : "text-[#1a1a1a]"
                      }`}
                    >
                      {cat}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {catalogError && products.length === 0 && (
            <ApiErrorState error={catalogError} onRetry={() => void productsQ.refetch()} />
          )}

          {catalogLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse"
                >
                  <div className="aspect-[4/3] bg-[#eceae7]" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-[#eceae7] rounded w-3/4" />
                    <div className="h-3 bg-[#f0eeeb] rounded w-1/2" />
                    <div className="h-6 bg-[#eceae7] rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!catalogLoading && !catalogError && products.length === 0 && (
            <div className="text-center py-16 text-[#9b9b9b] font-semibold">
              Nenhum produto disponível no momento.
            </div>
          )}

          {!catalogLoading && !catalogError && products.length > 0 && activeCategory === "" && (
            <div className="text-center py-16 text-[#9b9b9b] font-semibold">
              Selecione uma categoria para ver os produtos.
            </div>
          )}

          {!catalogLoading && products.length > 0 && activeCategory !== "" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map((product) => {
              const qty = productQty[product.id] ?? 1;
              const inCart = cart.find((i) => i.product.id === product.id);
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="p-3 sm:p-4">
                    <div className="relative flex items-center justify-center">
                      <h3 className="font-bold text-[#1a1a1a] text-sm leading-tight text-center">
                        {product.name}
                      </h3>
                      {inCart && (
                        <span className="absolute right-0 top-0 flex-shrink-0 bg-[#2563EB] text-white text-xs font-black rounded-full w-6 h-6 flex items-center justify-center">
                          {inCart.qty}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-4 sm:gap-5 mt-4 mb-3">
                      <button
                        onClick={() => adjustQty(product.id, -1)}
                        style={{ touchAction: "manipulation" }}
                        className="w-7 h-7 rounded-full border-2 border-[#e8e6e2] flex items-center justify-center hover:border-[#2563EB] hover:text-[#2563EB] transition-all"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-black text-[#1a1a1a] text-base">
                        {qty}
                      </span>
                      <button
                        onClick={() => adjustQty(product.id, 1)}
                        style={{ touchAction: "manipulation" }}
                        className="w-7 h-7 rounded-full border-2 border-[#e8e6e2] flex items-center justify-center hover:border-[#2563EB] hover:text-[#2563EB] transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      style={{ touchAction: "manipulation" }}
                      className="mx-auto block px-6 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 text-white font-bold text-sm py-2 rounded-lg transition-all"
                    >
                      Solicitar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </section>

      {cartCount > 0 && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => setCartOpen(true)}
            style={{ touchAction: "manipulation" }}
            className="bg-[#1a1a1a] text-white font-black text-base px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 hover:bg-[#2a2a2a] active:scale-95 transition-all"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-2.5 -right-2.5 bg-[#2563EB] text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            </div>
            <span>Ver carrinho</span>
          </button>
        </div>
      )}

      {cartOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setCartOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-[#f7f5f2] z-50 flex flex-col shadow-2xl rounded-l-3xl overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="bg-[#1a1a1a] px-6 py-5 flex items-center justify-between flex-shrink-0">
              <div>
                <p className="text-[#2563EB] font-black text-[11px] uppercase tracking-[0.2em]">
                  Seu pedido
                </p>
                <h2 className="text-xl font-black text-white mt-0.5">Carrinho</h2>
                <p className="text-white/50 text-sm font-medium">
                  {cartCount} {cartCount === 1 ? "item" : "itens"}
                </p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                style={{ touchAction: "manipulation" }}
                aria-label="Fechar carrinho"
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-5 shadow-sm">
                    <ShoppingCart className="w-9 h-9 text-[#e0ddd8]" />
                  </div>
                  <p className="text-[#1a1a1a] font-black text-lg">Carrinho vazio</p>
                  <p className="text-[#9b9b9b] text-sm font-medium mt-1 mb-6">
                    Adicione produtos para continuar.
                  </p>
                  <button
                    onClick={() => setCartOpen(false)}
                    style={{ touchAction: "manipulation" }}
                    className="bg-[#1a1a1a] hover:bg-[#2a2a2a] active:scale-95 text-white font-bold text-sm px-6 py-3 rounded-full transition-all"
                  >
                    Ver o cardápio
                  </button>
                </div>
              ) : (
                <div className="px-5 space-y-2.5">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 bg-white rounded-2xl border border-[#f0eeeb] shadow-sm p-3.5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1a1a1a] text-sm leading-snug">
                          {item.product.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#f7f5f2] rounded-full p-1 flex-shrink-0">
                        <button
                          onClick={() => cartAdjust(item.product.id, item.qty - 1)}
                          style={{ touchAction: "manipulation" }}
                          aria-label={item.qty === 1 ? "Remover item" : "Diminuir quantidade"}
                          className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#1a1a1a] hover:bg-[#2563EB] hover:text-white transition-all shadow-sm"
                        >
                          {item.qty === 1 ? (
                            <X className="w-3.5 h-3.5" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="w-5 text-center font-black text-[#1a1a1a] text-sm">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => cartAdjust(item.product.id, item.qty + 1)}
                          style={{ touchAction: "manipulation" }}
                          aria-label="Aumentar quantidade"
                          className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#1a1a1a] hover:bg-[#2563EB] hover:text-white transition-all shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="bg-white border-t border-[#f0eeeb] px-6 py-5 space-y-2.5 flex-shrink-0">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[#9b9b9b] font-semibold text-sm">Total de itens</span>
                  <span className="font-black text-[#1a1a1a] text-lg">{cartCount}</span>
                </div>
                <button
                  onClick={() => {
                    setCartOpen(false);
                    setScreen("checkout");
                  }}
                  style={{ touchAction: "manipulation" }}
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] text-white font-black text-lg py-4 rounded-2xl transition-all shadow-lg shadow-[#2563EB]/30"
                >
                  Finalizar pedido
                </button>
                <button
                  onClick={() => setCartOpen(false)}
                  style={{ touchAction: "manipulation" }}
                  className="w-full bg-[#f0eeeb] hover:bg-[#e8e6e2] text-[#1a1a1a] font-bold text-base py-3.5 rounded-2xl transition-all"
                >
                  Continuar escolhendo
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
