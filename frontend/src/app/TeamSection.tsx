import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Users, Lock } from "lucide-react";
import {
  type TeamMember as Member,
  getTeam,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from "../api/portal";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
}

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
};

export default function TeamSection() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    getTeam()
      .then(setMembers)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Falha ao carregar."))
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (m: Member) => {
    setEditId(m.id);
    setForm({
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTeamMember(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao remover.");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.email.trim()) return;
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
    };
    setSaving(true);
    setError(null);
    try {
      if (editId !== null) {
        const updated = await updateTeamMember(editId, payload);
        setMembers((prev) => prev.map((m) => (m.id === editId ? updated : m)));
      } else {
        const created = await createTeamMember(payload);
        setMembers((prev) => [...prev, created]);
      }
      setModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const formValid = form.firstName.trim().length > 0 && form.email.trim().length > 0;

  const inputClass =
    "w-full bg-[#f5f3f0] border-2 border-transparent focus:border-[#2563EB] rounded-xl px-4 py-3 text-sm font-semibold text-[#1a1a1a] outline-none transition-all placeholder:text-[#c0c0c0] placeholder:font-normal";

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#1a1a1a] tracking-tight">Equipe</h1>
          <p className="text-[#6b6b6b] text-sm font-medium mt-0.5">
            Gerencie os usuários com acesso à gestão das Salas de Reunião
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-6 py-3.5 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#2563EB]/25 active:scale-95"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          Adicionar Usuário
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto border border-[#f0eeeb]">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="bg-[#faf9f7] border-b border-[#f0eeeb]">
              <th className="text-left px-5 py-4 text-xs font-black text-[#9b9b9b] uppercase tracking-wider">
                Nome
              </th>
              <th className="text-left px-5 py-4 text-xs font-black text-[#9b9b9b] uppercase tracking-wider">
                E-mail
              </th>
              <th className="text-left px-5 py-4 text-xs font-black text-[#9b9b9b] uppercase tracking-wider w-56">
                Acesso
              </th>
              <th className="text-right px-5 py-4 text-xs font-black text-[#9b9b9b] uppercase tracking-wider w-28">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f5f3f0]">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-[#fafaf8] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                      {(m.firstName[0] ?? "").toUpperCase()}
                      {(m.lastName[0] ?? "").toUpperCase()}
                    </div>
                    <p className="font-bold text-[#1a1a1a] text-sm">
                      {m.firstName} {m.lastName}
                    </p>
                  </div>
                </td>

                <td className="px-5 py-3.5">
                  <span className="text-sm font-medium text-[#6b6b6b]">{m.email}</span>
                </td>

                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                    Administrador
                  </span>
                </td>

                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(m)}
                      title="Editar"
                      className="w-9 h-9 rounded-lg bg-[#f0eeeb] text-[#6b6b6b] hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all active:scale-90"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {m.protected ? (
                      <span
                        title="Usuário protegido — não pode ser removido"
                        className="w-9 h-9 rounded-lg bg-[#f0eeeb] text-[#c0c0c0] flex items-center justify-center cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4" />
                      </span>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(m.id)}
                        title="Remover"
                        className="w-9 h-9 rounded-lg bg-[#f0eeeb] text-[#6b6b6b] hover:bg-[#2563EB] hover:text-white flex items-center justify-center transition-all active:scale-90"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan={4} className="px-5 py-20 text-center text-[#9b9b9b] font-semibold">
                  Carregando…
                </td>
              </tr>
            )}

            {!loading && members.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-20 text-center">
                  <Users className="w-10 h-10 text-[#e0e0e0] mx-auto mb-3" />
                  <p className="text-[#9b9b9b] font-semibold">Nenhum usuário cadastrado.</p>
                  <p className="text-[#c0c0c0] text-sm mt-1">
                    Clique em "Adicionar Usuário" para começar.
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0eeeb]">
                <h2 className="text-lg font-black text-[#1a1a1a]">
                  {editId !== null ? "Editar usuário" : "Adicionar usuário"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-[#f0eeeb] flex items-center justify-center hover:bg-[#e8e6e2] transition-colors"
                >
                  <X className="w-4 h-4 text-[#1a1a1a]" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-[#1a1a1a] mb-1.5">Nome</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Ex: João"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#1a1a1a] mb-1.5">
                      Sobrenome
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Ex: Silva"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1a1a1a] mb-1.5">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="nome@suaempresa.com.br"
                    className={inputClass}
                  />
                </div>

                <div className="bg-[#f5f3f0] rounded-xl px-4 py-3">
                  <p className="text-sm font-bold text-[#1a1a1a]">Acesso: Administrador</p>
                  <p className="text-xs text-[#9b9b9b] font-medium mt-0.5">
                    Todo usuário da Equipe tem acesso total à gestão.
                  </p>
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
                  disabled={!formValid || saving}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                    formValid && !saving
                      ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-95"
                      : "bg-[#e8e6e2] text-[#b0b0b0] cursor-not-allowed"
                  }`}
                >
                  {saving ? "Salvando…" : editId !== null ? "Salvar alterações" : "Adicionar"}
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
              <h3 className="text-lg font-black text-[#1a1a1a] mb-2">Remover usuário?</h3>
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
                  Remover
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
