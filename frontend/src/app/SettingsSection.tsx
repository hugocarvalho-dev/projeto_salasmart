import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Tag } from "lucide-react";
import {
  type Category,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/portal";
import { byName } from "../lib/sort";

const inputClass =
  "w-full bg-[#f5f3f0] border-2 border-transparent focus:border-[#2563EB] rounded-xl px-4 py-3 text-sm font-semibold text-[#1a1a1a] outline-none transition-all placeholder:text-[#c0c0c0] placeholder:font-normal";

export default function SettingsSection() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#1a1a1a] tracking-tight">Configurações</h1>
        <p className="text-[#6b6b6b] text-sm font-medium mt-0.5">
          Ajuste as listas suspensas do sistema
        </p>
      </div>

      <ListsPanel />
    </>
  );
}

function ListsPanel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCat, setNewCat] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Falha ao carregar."));
  }, []);

  const addCat = async () => {
    const label = newCat.trim();
    if (!label) return;
    if (categories.some((c) => c.label.toLowerCase() === label.toLowerCase())) return;
    setError(null);
    try {
      const created = await createCategory(label);
      setCategories((prev) => [...prev, created]);
      setNewCat("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao adicionar.");
    }
  };

  const saveEdit = async (id: number) => {
    const label = editValue.trim();
    if (!label) return;
    setError(null);
    try {
      const updated = await updateCategory(id, label);
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar.");
    }
  };

  const removeCat = async (id: number) => {
    setError(null);
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao remover.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center flex-shrink-0">
          <Tag className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-black text-[#1a1a1a] text-lg">Categorias de produtos</h2>
          <p className="text-[#9b9b9b] text-sm font-medium">
            Estas categorias aparecem como lista suspensa no cadastro de produtos.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-5">
        <input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCat()}
          placeholder="Nova categoria (ex: Congelados)"
          className={inputClass}
        />
        <button
          onClick={addCat}
          disabled={!newCat.trim()}
          className={`flex items-center gap-2 px-5 rounded-xl font-bold text-sm transition-all flex-shrink-0 ${
            newCat.trim()
              ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-95"
              : "bg-[#e8e6e2] text-[#b0b0b0] cursor-not-allowed"
          }`}
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} /> Adicionar
        </button>
      </div>

      <div className="space-y-2">
        {[...categories].sort((a, b) => byName(a.label, b.label)).map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 bg-[#faf9f7] rounded-xl px-4 py-3 border border-[#f0eeeb]"
          >
            {editId === c.id ? (
              <>
                <input
                  value={editValue}
                  autoFocus
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(c.id)}
                  className="flex-1 bg-white border-2 border-[#2563EB] rounded-lg px-3 py-2 text-sm font-semibold text-[#1a1a1a] outline-none"
                />
                <button
                  onClick={() => saveEdit(c.id)}
                  className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center hover:bg-[#1D4ED8] transition-colors"
                >
                  <Check className="w-4 h-4" strokeWidth={3} />
                </button>
                <button
                  onClick={() => setEditId(null)}
                  className="w-8 h-8 rounded-lg bg-[#e8e6e2] text-[#6b6b6b] flex items-center justify-center hover:bg-[#dcdad6] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 font-bold text-[#1a1a1a] text-sm">{c.label}</span>
                <button
                  onClick={() => {
                    setEditId(c.id);
                    setEditValue(c.label);
                  }}
                  title="Editar"
                  className="w-8 h-8 rounded-lg bg-[#f0eeeb] text-[#6b6b6b] hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => removeCat(c.id)}
                  title="Remover"
                  className="w-8 h-8 rounded-lg bg-[#f0eeeb] text-[#6b6b6b] hover:bg-[#2563EB] hover:text-white flex items-center justify-center transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-center text-[#9b9b9b] font-semibold py-8 text-sm">
            Nenhuma categoria cadastrada.
          </p>
        )}
      </div>
    </div>
  );
}
