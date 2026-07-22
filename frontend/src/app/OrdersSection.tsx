import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  MapPin,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useOrderMonths, useOrders } from "../hooks/queries";
import { softDeletePurchase } from "../api/portal";
import { queryClient } from "../lib/queryClient";
import { ApiErrorState } from "./ApiState";
import { ROOMS } from "./rooms";
import FilterSelect from "./FilterSelect";
import type { Purchase } from "./portalData";

const fmtDateTime = (d: Date) =>
  d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const monthValue = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const monthLabel = (value: string): string => {
  const [year, m] = value.split("-").map(Number);
  return `${MONTH_NAMES[(m || 1) - 1]} de ${year}`;
};

const PAGE_SIZE = 12;

export default function OrdersSection() {
  const [month, setMonth] = useState<string>(() => monthValue(new Date()));
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [roomFilter, setRoomFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const monthsQ = useOrderMonths();
  const monthOptions = useMemo(() => {
    const list = monthsQ.data?.length ? monthsQ.data : [monthValue(new Date())];
    return [
      { value: "", label: "Todo o período" },
      ...list.map((v) => ({ value: v, label: monthLabel(v) })),
    ];
  }, [monthsQ.data]);

  useEffect(() => {
    const list = monthsQ.data;
    if (month !== "" && list?.length && !list.includes(month)) setMonth(list[0]);
  }, [monthsQ.data, month]);

  const roomOptions = useMemo(
    () => [{ value: "", label: "Todas as salas" }, ...ROOMS.map((r) => ({ value: r.label, label: r.label }))],
    [],
  );

  const ordersQ = useOrders(includeDeleted, month || undefined);
  const orders = ordersQ.data ?? [];

  const [toDelete, setToDelete] = useState<Purchase | null>(null);
  const [reason, setReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["orders"], exact: false });

  const confirmDelete = async () => {
    if (!toDelete || reason.trim().length < 3) return;
    setDeleting(true);
    setActionError(null);
    try {
      await softDeletePurchase(toDelete.id, { reason: reason.trim() });
      await invalidate();
      setToDelete(null);
      setReason("");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Falha ao excluir o pedido.");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const term = norm(search.trim());
    return orders.filter((o) => {
      if (roomFilter && o.room !== roomFilter) return false;
      if (!term) return true;
      const haystack = norm(`${o.customerName} ${o.items.map((i) => i.name).join(" ")}`);
      return haystack.includes(term);
    });
  }, [orders, roomFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [month, includeDeleted, roomFilter, search]);

  if (ordersQ.error) {
    return (
      <div className="max-w-md">
        <ApiErrorState error={ordersQ.error} onRetry={() => void ordersQ.refetch()} />
      </div>
    );
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-black text-[#1a1a1a] tracking-tight">Pedidos</h1>
        <p className="text-[#6b6b6b] text-sm font-medium mt-0.5">
          Pedidos recebidos — nome do cliente e itens.
        </p>
      </div>

      <div className="mb-4 bg-white rounded-2xl shadow-sm p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#9b9b9b] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente ou item…"
              className="w-full bg-[#f7f5f2] border border-transparent rounded-xl pl-10 pr-9 py-2.5 text-sm font-semibold text-[#1a1a1a] outline-none transition-all focus:border-[#2563EB] focus:bg-white placeholder:text-[#b0b0b0] placeholder:font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Limpar busca"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[#9b9b9b] hover:bg-[#e8e6e2] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <FilterSelect
              icon={CalendarDays}
              value={month}
              options={monthOptions}
              onChange={setMonth}
              ariaLabel="Filtrar por período"
              className="sm:w-52"
            />

            <FilterSelect
              icon={MapPin}
              value={roomFilter}
              options={roomOptions}
              onChange={setRoomFilter}
              ariaLabel="Filtrar por sala"
              className="sm:w-44"
            />

            <button
              type="button"
              role="switch"
              aria-checked={includeDeleted}
              onClick={() => setIncludeDeleted((v) => !v)}
              className={`flex items-center justify-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-bold border transition-all whitespace-nowrap ${
                includeDeleted
                  ? "bg-[#2563EB]/10 border-[#2563EB]/30 text-[#2563EB]"
                  : "bg-white border-[#e8e6e2] text-[#6b6b6b] hover:border-[#d4d0cb]"
              }`}
            >
              <span
                className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                  includeDeleted ? "bg-[#2563EB]" : "bg-[#d4d0cb]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    includeDeleted ? "translate-x-4" : ""
                  }`}
                />
              </span>
              Mostrar excluídos
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[520px]">
          <thead>
            <tr className="border-b-2 border-[#f0eeeb]">
              <th className="text-left px-5 py-4 text-xs font-black text-[#9b9b9b] uppercase tracking-wider">
                Data
              </th>
              <th className="text-left px-5 py-4 text-xs font-black text-[#9b9b9b] uppercase tracking-wider">
                Cliente
              </th>
              <th className="text-left px-5 py-4 text-xs font-black text-[#9b9b9b] uppercase tracking-wider">
                Sala
              </th>
              <th className="text-left px-5 py-4 text-xs font-black text-[#9b9b9b] uppercase tracking-wider">
                Itens
              </th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f5f3f0]">
            {pageItems.map((o) => {
              const isOpen = expanded.has(o.id);
              const totalQty = o.items.reduce((s, i) => s + i.qty, 0);
              return (
              <Fragment key={o.id}>
              <tr
                className={`hover:bg-[#fafaf8] transition-colors ${o.deletion ? "opacity-60" : ""} ${
                  isOpen ? "bg-[#fafaf8]" : ""
                }`}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#9b9b9b]" />
                    <span className="text-sm font-semibold text-[#1a1a1a] whitespace-nowrap">
                      {fmtDateTime(o.date)}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`text-sm font-bold text-[#1a1a1a] ${o.deletion ? "line-through" : ""}`}
                  >
                    {o.customerName}
                  </span>
                  {o.deletion && (
                    <span className="ml-2 text-[11px] font-bold text-[#2563EB]">excluído</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {o.room ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#f0eeeb] text-[#6b6b6b] whitespace-nowrap">
                      {o.room}
                    </span>
                  ) : (
                    <span className="text-xs text-[#c0c0c0] font-medium">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 max-w-[340px]">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(o.id)}
                    aria-expanded={isOpen}
                    title={isOpen ? "Recolher itens" : "Ver todos os itens"}
                    className="group flex w-full items-start gap-2 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-semibold text-[#1a1a1a] leading-tight ${
                          isOpen ? "whitespace-normal" : "truncate"
                        }`}
                      >
                        {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                      </span>
                      <span className="block text-xs text-[#9b9b9b] mt-0.5">
                        {totalQty} {totalQty === 1 ? "item" : "itens"} ·{" "}
                        <span className="font-bold text-[#2563EB] group-hover:underline">
                          {isOpen ? "recolher" : "ver todos"}
                        </span>
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 text-[#9b9b9b] transition-transform group-hover:text-[#2563EB] ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </td>
                <td className="px-5 py-3.5 text-right">
                  {!o.deletion && (
                    <button
                      onClick={() => {
                        setToDelete(o);
                        setReason("");
                        setActionError(null);
                      }}
                      title="Excluir pedido"
                      className="w-8 h-8 rounded-lg bg-[#f0eeeb] text-[#6b6b6b] hover:bg-[#2563EB] hover:text-white flex items-center justify-center transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>

              {isOpen && (
                <tr className="bg-[#fafaf8]">
                  <td colSpan={5} className="px-5 pb-4 pt-0">
                    <div className="rounded-xl border border-[#f0eeeb] bg-white p-3.5">
                      <p className="mb-2.5 text-[11px] font-black uppercase tracking-wider text-[#9b9b9b]">
                        Itens do pedido
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {o.items.map((i, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#f0eeeb] bg-[#fafaf8] py-1 pl-1.5 pr-2.5 text-sm font-semibold text-[#1a1a1a]"
                          >
                            <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded-md bg-[#2563EB]/10 px-1 text-[11px] font-black text-[#2563EB]">
                              {i.qty}×
                            </span>
                            {i.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
              );
            })}
            {filtered.length === 0 && !ordersQ.isLoading && (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-[#9b9b9b] font-semibold">
                  {orders.length === 0
                    ? "Nenhum pedido neste mês."
                    : "Nenhum pedido corresponde aos filtros."}
                </td>
              </tr>
            )}
            {ordersQ.isLoading && (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center text-[#9b9b9b] font-semibold">
                  Carregando…
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-[#f0eeeb]">
            <p className="text-xs font-semibold text-[#9b9b9b]">
              Mostrando{" "}
              <span className="text-[#1a1a1a]">
                {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)}
              </span>{" "}
              de <span className="text-[#1a1a1a]">{filtered.length}</span> pedidos
            </p>
            {pageCount > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b6b6b] bg-[#f0eeeb] hover:bg-[#e8e6e2] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-8 h-8 px-2 rounded-lg text-sm font-bold transition-all ${
                      p === currentPage
                        ? "bg-[#2563EB] text-white shadow-sm shadow-[#2563EB]/30"
                        : "text-[#6b6b6b] bg-[#f0eeeb] hover:bg-[#e8e6e2]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={currentPage === pageCount}
                  aria-label="Próxima página"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b6b6b] bg-[#f0eeeb] hover:bg-[#e8e6e2] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {toDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setToDelete(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <h2 className="text-lg font-black text-[#1a1a1a]">Excluir pedido</h2>
              <button
                onClick={() => !deleting && setToDelete(null)}
                className="w-9 h-9 rounded-full bg-[#f0eeeb] flex items-center justify-center hover:bg-[#e8e6e2] transition-colors"
              >
                <X className="w-5 h-5 text-[#1a1a1a]" />
              </button>
            </div>
            <div className="px-6 py-4">
              <p className="text-[#6b6b6b] text-sm font-medium mb-4">
                Pedido de <span className="font-bold text-[#1a1a1a]">{toDelete.customerName}</span>. A
                exclusão é lógica (mantida no histórico com auditoria).
              </p>
              <label className="block text-sm font-bold text-[#1a1a1a] mb-1.5">
                Motivo da exclusão
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Descreva o motivo (mín. 3 caracteres)…"
                className="w-full h-24 bg-[#f5f3f0] border-2 border-transparent focus:border-[#2563EB] rounded-xl px-4 py-3 text-sm font-semibold text-[#1a1a1a] outline-none transition-all resize-none"
              />
              {actionError && (
                <div className="mt-3 flex items-start gap-2 text-[#2563EB] text-sm font-semibold">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {actionError}
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 pb-6 pt-1">
              <button
                onClick={() => setToDelete(null)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-[#f0eeeb] text-[#1a1a1a] hover:bg-[#e8e6e2] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => void confirmDelete()}
                disabled={deleting || reason.trim().length < 3}
                className="flex-1 py-3 rounded-xl font-black text-sm bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-50 active:scale-95 transition-all"
              >
                {deleting ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
