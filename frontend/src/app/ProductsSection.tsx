import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ImageOff, X, Check, ChevronDown } from "lucide-react";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
  getCategories,
} from "../api/portal";
import { ApiErrorState, ApiErrorBanner } from "./ApiState";
import { byName } from "../lib/sort";

interface AdminProduct {
  id: number;
  name: string;
  category: string;
  unit: string;
}

interface FormState {
  name: string;
  category: string;
  unit: string;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const catColor = (label: string) => {
  const c = norm(label);
  if (c.includes("agua")) return "bg-sky-100 text-sky-700";
  if (c.includes("caf")) return "bg-amber-100 text-amber-800";
  if (c.includes("cha")) return "bg-green-100 text-green-700";
  if (c.includes("snack")) return "bg-orange-100 text-orange-700";
  return "bg-[#f0eeeb] text-[#6b6b6b]";
};

const EMPTY_FORM: FormState = { name: "", category: "", unit: "" };

export default function ProductsSection() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [actionError, setActionError] = useState<unknown>(null);

  const reload = () =>
    getProducts().then((list) =>
      setProducts(
        list
          .map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            unit: p.unit,
          }))
          .sort((a, b) => byName(a.name, b.name)),
      ),
    );

  const load = () => {
    setError(null);
    Promise.all([reload(), getCategories()])
      .then(([, cats]) => setCategories(cats.map((c) => c.label)))
      .catch(setError);
  };
  useEffect(load, []);

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: AdminProduct) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      unit: p.unit,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    setActionError(null);
    try {
      await deleteProduct(id);
      await reload();
    } catch (e) {
      setActionError(e);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category) return;

    const payload = {
      name: form.name.trim(),
      category: form.category,
      unit: form.unit.trim(),
    };

    setActionError(null);
    try {
      if (editId !== null) await updateProduct(editId, payload);
      else await createProduct(payload);
      await reload();
      setModalOpen(false);
    } catch (e) {
      setActionError(e);
      setModalOpen(false);
    }
  };

  const formValid = form.name.trim().length > 0 && form.category.length > 0;

  if (error) {
    return (
      <>
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#1a1a1a] tracking-tight">Produtos</h1>
          <p className="text-[#6b6b6b] text-sm font-medium mt-0.5">
            Gerencie os itens disponíveis nas Salas de Reunião
          </p>
        </div>
        <ApiErrorState error={error} onRetry={load} />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#1a1a1a] tracking-tight">Produtos</h1>
          <p className="text-[#6b6b6b] text-sm font-medium mt-0.5">
            Gerencie os itens disponíveis nas Salas de Reunião
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-6 py-3.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#2563EB]/25 active:scale-95"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          Adicionar Produto
        </button>
      </div>

      {actionError && <ApiErrorBanner error={actionError} />}

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto border border-[#f0eeeb]">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="bg-[#faf9f7] border-b border-[#f0eeeb]">
              <th className="text-left px-5 py-4 text-xs font-black text-[#9b9b9b] uppercase tracking-wider">
                Nome
              </th>
              <th className="text-left px-5 py-4 text-xs font-black text-[#9b9b9b] uppercase tracking-wider w-36">
                Categoria
              </th>
              <th className="text-right px-5 py-4 text-xs font-black text-[#9b9b9b] uppercase tracking-wider w-28">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f5f3f0]">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-[#fafaf8] transition-colors">
                <td className="px-5 py-3.5">
                  <p className="font-bold text-[#1a1a1a] text-sm">{p.name}</p>
                  {p.unit && <p className="text-[#9b9b9b] text-xs font-medium mt-0.5">{p.unit}</p>}
                </td>

                <td className="px-5 py-3.5">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${catColor(p.category)}`}
                  >
                    {p.category}
                  </span>
                </td>

                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(p)}
                      title="Editar"
                      className="w-9 h-9 rounded-lg bg-[#f0eeeb] text-[#6b6b6b] hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all active:scale-90"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(p.id)}
                      title="Excluir"
                      className="w-9 h-9 rounded-lg bg-[#f0eeeb] text-[#6b6b6b] hover:bg-[#2563EB] hover:text-white flex items-center justify-center transition-all active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-20 text-center">
                  <ImageOff className="w-10 h-10 text-[#e0e0e0] mx-auto mb-3" />
                  <p className="text-[#9b9b9b] font-semibold">Nenhum produto cadastrado.</p>
                  <p className="text-[#c0c0c0] text-sm mt-1">
                    Clique em "+ Adicionar produto" para começar.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0eeeb]">
                <h2 className="text-lg font-black text-[#1a1a1a]">
                  {editId !== null ? "Editar produto" : "Adicionar produto"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-[#f0eeeb] flex items-center justify-center hover:bg-[#e8e6e2] transition-colors"
                >
                  <X className="w-4 h-4 text-[#1a1a1a]" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#1a1a1a] mb-1.5">
                    Nome do produto
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Água Mineral"
                    className="w-full bg-[#f5f3f0] border-2 border-transparent focus:border-[#2563EB] rounded-xl px-4 py-3 text-sm font-semibold text-[#1a1a1a] outline-none transition-all placeholder:text-[#c0c0c0] placeholder:font-normal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1a1a1a] mb-1.5">
                    Unidade <span className="text-[#9b9b9b] font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                    placeholder="Ex: lata 350ml, pacote 50g"
                    className="w-full bg-[#f5f3f0] border-2 border-transparent focus:border-[#2563EB] rounded-xl px-4 py-3 text-sm font-semibold text-[#1a1a1a] outline-none transition-all placeholder:text-[#c0c0c0] placeholder:font-normal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1a1a1a] mb-1.5">Categoria</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setCatOpen((o) => !o)}
                      className={`w-full bg-[#f5f3f0] border-2 rounded-xl px-4 py-3 text-sm font-semibold text-[#1a1a1a] outline-none transition-all flex items-center justify-between cursor-pointer ${
                        catOpen ? "border-[#2563EB]" : "border-transparent"
                      }`}
                    >
                      <span className={form.category ? "" : "text-[#c0c0c0] font-normal"}>
                        {form.category || "Selecione uma categoria"}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#9b9b9b] transition-transform ${catOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {catOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setCatOpen(false)} />
                        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-[#f0eeeb] p-1.5 z-20 origin-top max-h-60 overflow-y-auto">
                          {categories.map((c) => {
                            const active = form.category === c;
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  setForm((prev) => ({ ...prev, category: c }));
                                  setCatOpen(false);
                                }}
                                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold text-left transition-colors ${
                                  active
                                    ? "bg-[#2563EB]/5 text-[#2563EB]"
                                    : "text-[#1a1a1a] hover:bg-[#f5f3f0]"
                                }`}
                              >
                                {c}
                                {active && <Check className="w-4 h-4 ml-auto" strokeWidth={3} />}
                              </button>
                            );
                          })}
                          {categories.length === 0 && (
                            <p className="px-3 py-2.5 text-sm text-[#9b9b9b] font-medium">
                              Nenhuma categoria. Cadastre em Configurações.
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-[#e8e6e2] text-[#1a1a1a] font-bold text-sm hover:bg-[#f5f3f0] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formValid}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                    formValid
                      ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-95"
                      : "bg-[#e8e6e2] text-[#b0b0b0] cursor-not-allowed"
                  }`}
                >
                  {editId !== null ? "Salvar alterações" : "Adicionar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {deleteConfirm !== null && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h3 className="text-lg font-black text-[#1a1a1a] mb-2">Excluir produto?</h3>
              <p className="text-[#6b6b6b] text-sm mb-5">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl border-2 border-[#e8e6e2] text-[#1a1a1a] font-bold text-sm hover:bg-[#f5f3f0] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-3 rounded-xl bg-[#2563EB] text-white font-bold text-sm hover:bg-[#1D4ED8] active:scale-95 transition-all"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
