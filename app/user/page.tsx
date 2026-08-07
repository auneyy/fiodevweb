"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getClientCloudId } from "@/lib/user-settings-client";
import GlassCard from "../components/GlassCard";
import Toast from "../components/Toast";
import { cn, encodePhotoToTemplate } from "@/lib/utils";
import {
  Users, Search, Plus, RefreshCw, MoreVertical, Trash2, Edit, Eye, UserPlus,
  Loader2, X, Copy, Check, Fingerprint, ScanFace, Activity,
} from "lucide-react";

interface User {
  id: number;
  pin: string;
  name: string;
  privilege: number;
  finger: number;
  face: number;
  rfid: number;
  vein: number;
  password: string;
  template: string;
  synced_at: string;
}

export default function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [cloudId, setCloudId] = useState("");
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const [formPin, setFormPin] = useState("");
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPrivilege, setFormPrivilege] = useState(0);
  const [formRfid, setFormRfid] = useState("");
  const [formTemplate, setFormTemplate] = useState("");
  const [formPhoto, setFormPhoto] = useState<File | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [regVerification, setRegVerification] = useState(0);
  const [regLoading, setRegLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadUsers = async () => {
    setLoading(true);
    const cid = await getClientCloudId();
    setCloudId(cid || "");
    if (!cid) {
      setUsers([]);
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("cloud_id", cid)
      .order("pin");
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: before } = await createClient()
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("cloud_id", cloudId);
      const countBefore = before?.length ?? 0;

      await fetch("/mesin/get-userinfo", { method: "POST" });
      showToast("Perintah terkirim. Menunggu respons mesin...", "success");

      let attempts = 0;
      const maxAttempts = 15;
      const pollInterval = setInterval(async () => {
        attempts++;
        await loadUsers();

        const { data: after } = await createClient()
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("cloud_id", cloudId);
        const countAfter = after?.length ?? 0;

        if (countAfter > countBefore || attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setSyncing(false);
          if (countAfter > countBefore) {
            showToast(`Sinkronisasi selesai! ${countAfter - countBefore} user baru ditemukan.`, "success");
          } else {
            showToast("Sinkronisasi selesai", "success");
          }
        }
      }, 2000);
    } catch {
      showToast("Gagal mengirim perintah", "error");
      setSyncing(false);
    }
  };

  const handleAddUser = async () => {
    if (!formPin || !formName) {
      showToast("PIN dan Nama wajib diisi", "error");
      return;
    }
    if (!/^\d+$/.test(formPin)) {
      showToast("PIN harus berupa angka", "error");
      return;
    }
    setFormLoading(true);
    try {
      let templateVal = formTemplate;
      if (formPhoto) {
        templateVal = await encodePhotoToTemplate(formPhoto);
      }
      const res = await fetch("/mesin/set-userinfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: formPin,
          name: formName,
          password: formPassword,
          privilege: formPrivilege,
          rfid: formRfid,
          template: templateVal,
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast("User berhasil ditambahkan", "success");
        setShowAddModal(false);
        resetForm();
        await loadUsers();
      } else {
        showToast(result.message || "Gagal menambahkan user", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    }
    setFormLoading(false);
  };

  const handleEditUser = async () => {
    if (!formName) {
      showToast("Nama wajib diisi", "error");
      return;
    }
    setFormLoading(true);
    try {
      let templateVal = formTemplate;
      if (formPhoto) {
        templateVal = await encodePhotoToTemplate(formPhoto);
      }
      const res = await fetch("/mesin/set-userinfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: formPin,
          name: formName,
          password: formPassword,
          privilege: formPrivilege,
          rfid: formRfid,
          template: templateVal,
        }),
      });
      const result = await res.json();
      if (result.success) {
        showToast("User berhasil diupdate", "success");
        setShowEditModal(false);
        resetForm();
        await loadUsers();
      } else {
        showToast(result.message || "Gagal mengupdate user", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    }
    setFormLoading(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setFormLoading(true);
    try {
      const res = await fetch("/mesin/delete-userinfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: selectedUser.pin }),
      });
      const result = await res.json();
      if (result.success) {
        showToast("User berhasil dihapus", "success");
        setShowDeleteDialog(false);
        setSelectedUser(null);
        await loadUsers();
      } else {
        showToast(result.message || "Gagal menghapus user", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    }
    setFormLoading(false);
  };

  const handleRegisterOnline = async () => {
    if (!selectedUser) return;
    setRegLoading(true);
    try {
      const res = await fetch("/mesin/register-online", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: selectedUser.pin, verification: regVerification }),
      });
      const result = await res.json();
      if (result.success) {
        showToast("Perintah terkirim. Menunggu respons mesin sekitar 10 detik...", "success");
        setShowRegisterModal(false);
      } else {
        showToast(result.message || "Gagal register online", "error");
      }
    } catch {
      showToast("Terjadi kesalahan", "error");
    }
    setRegLoading(false);
  };

  const resetForm = () => {
    setFormPin("");
    setFormName("");
    setFormPassword("");
    setFormPrivilege(0);
    setFormRfid("");
    setFormTemplate("");
    setFormPhoto(null);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormPin(user.pin);
    setFormName(user.name);
    setFormPassword(user.password);
    setFormPrivilege(user.privilege);
    setFormRfid(user.rfid ? String(user.rfid) : "");
    setFormTemplate(user.template);
    setFormPhoto(null);
    setShowEditModal(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const openRegisterModal = (user: User) => {
    setSelectedUser(user);
    setRegVerification(0);
    setShowRegisterModal(true);
  };

  const openDetailDrawer = (user: User) => {
    setSelectedUser(user);
    setShowDetailDrawer(true);
  };

  const copyTemplate = () => {
    if (selectedUser?.template) {
      navigator.clipboard.writeText(selectedUser.template);
      setCopiedTemplate(true);
      setTimeout(() => setCopiedTemplate(false), 2000);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.pin.includes(search) ||
      u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} />}

      <GlassCard className="p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-gray-400" />
            <h2 className="text-xl font-bold text-white">Data User</h2>
            <span className="text-sm text-gray-400">({users.length} user)</span>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari PIN atau nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20"
              />
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-colors"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {syncing ? "Mengirim..." : "Sinkronisasi"}
            </button>
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-medium text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah
            </button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : (
           <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-500 font-semibold">No</th>
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-500 font-semibold">PIN</th>
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-500 font-semibold">Nama</th>
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-500 font-semibold">Privilege</th>
                   <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-500 font-semibold">Jari</th>
                   <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-500 font-semibold">Wajah</th>
                   <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-500 font-semibold">Vena</th>
                  <th className="px-5 py-3.5 text-xs uppercase tracking-wider text-gray-500 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                     <td colSpan={8} className="px-5 py-16 text-center text-gray-500 text-[15px]">
                      Tidak ada data user
                    </td>
                  </tr>
                ) : (
                  filtered.map((user, idx) => (
                    <tr key={user.id} className="hover:bg-white/[0.03] border-b border-white/[0.04] transition-colors duration-200">
                      <td className="px-5 py-4 text-[15px] text-gray-500">{idx + 1}</td>
                      <td className="px-5 py-4 text-[15px] font-semibold text-white font-mono">{user.pin}</td>
                      <td className="px-5 py-4 text-[15px] text-gray-300">{user.name}</td>
                      <td className="px-5 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[13px] font-medium",
                          user.privilege === 14
                            ? "bg-white/10 text-white"
                            : "bg-white/5 text-gray-400"
                        )}>
                          {user.privilege === 14 ? "Admin" : "User"}
                        </span>
                      </td>
                       <td className="px-5 py-4 text-[15px] text-gray-400">{user.finger > 0 ? `${user.finger}` : "-"}</td>
                       <td className="px-5 py-4 text-[15px] text-gray-400">{user.face > 0 ? "Ya" : "-"}</td>
                       <td className="px-5 py-4 text-[15px] text-gray-400">{user.vein > 0 ? "Ya" : "-"}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openDetailDrawer(user)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Detail">
                            <Eye className="w-4 h-4" />
                          </button>
                          <div className="relative group">
                            <button className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            <div className="absolute right-0 top-8 z-40 w-44 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                              <button onClick={() => openEditModal(user)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5 rounded-t-xl">
                                <Edit className="w-4 h-4" /> Edit
                              </button>
                              <button onClick={() => { openRegisterModal(user); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5">
                                <UserPlus className="w-4 h-4" /> Register Online
                              </button>
                              <button onClick={() => openDeleteDialog(user)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 rounded-b-xl">
                                <Trash2 className="w-4 h-4" /> Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a24] border border-white/10 rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">{showEditModal ? "Edit User" : "Tambah User"}</h3>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">PIN *</label>
                <input
                  type="text"
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value)}
                  disabled={showEditModal}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 disabled:opacity-50"
                  placeholder="Masukkan PIN (angka)"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nama *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20"
                  placeholder="Masukkan nama"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20"
                  placeholder="Masukkan password"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Privilege</label>
                <select
                  value={formPrivilege}
                  onChange={(e) => setFormPrivilege(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20"
                >
                  <option value={0}>User Biasa</option>
                  <option value={14}>Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">RFID Card</label>
                <input
                  type="text"
                  value={formRfid}
                  onChange={(e) => setFormRfid(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20"
                  placeholder="Masukkan nomor RFID"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Foto Wajah (maks 100KB)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormPhoto(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Template (Sidik Jari)</label>
                <textarea
                  value={formTemplate}
                  onChange={(e) => setFormTemplate(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 font-mono"
                  placeholder="Template data dari mesin"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-white/10">
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Batal
              </button>
              <button
                onClick={showEditModal ? handleEditUser : handleAddUser}
                disabled={formLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-colors"
              >
                {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {showEditModal ? "Simpan" : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteDialog && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a24] border border-white/10 rounded-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-white mb-2">Hapus User</h3>
            <p className="text-sm text-gray-400 mb-6">
              Apakah Anda yakin ingin menghapus user dengan PIN <span className="font-mono font-bold text-white">{selectedUser.pin}</span> ({selectedUser.name})?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowDeleteDialog(false); setSelectedUser(null); }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={formLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-colors"
              >
                {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {showRegisterModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a24] border border-white/10 rounded-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Register Online</h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <p className="text-sm text-gray-400">PIN: <span className="font-mono text-white">{selectedUser.pin}</span></p>
              
              <div>
                <label className="block text-sm text-gray-400 mb-3">Sidik Jari</label>
                <div className="grid grid-cols-5 gap-2">
                  {[0,1,2,3,4,5,6,7,8,9].map((num) => (
                    <button
                      key={num}
                      onClick={() => setRegVerification(num)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200",
                        regVerification === num
                          ? "bg-white/10 border-white/20 text-white"
                          : "bg-white/[0.03] border-white/[0.06] text-gray-400 hover:bg-white/[0.06] hover:text-gray-300"
                      )}
                    >
                      <Fingerprint className="w-5 h-5" />
                      <span className="text-[11px] font-medium">{num}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-3">Verifikasi Lain</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setRegVerification(12)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                      regVerification === 12
                        ? "bg-white/10 border-white/20 text-white"
                        : "bg-white/[0.03] border-white/[0.06] text-gray-400 hover:bg-white/[0.06] hover:text-gray-300"
                    )}
                  >
                    <ScanFace className="w-5 h-5" />
                    <span className="text-sm font-medium">Wajah</span>
                  </button>
                  <button
                    onClick={() => setRegVerification(13)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                      regVerification === 13
                        ? "bg-white/10 border-white/20 text-white"
                        : "bg-white/[0.03] border-white/[0.06] text-gray-400 hover:bg-white/[0.06] hover:text-gray-300"
                    )}
                  >
                    <Activity className="w-5 h-5" />
                    <span className="text-sm font-medium">Vena</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-white/10">
              <button onClick={() => setShowRegisterModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Batal
              </button>
              <button
                onClick={handleRegisterOnline}
                disabled={regLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-colors"
              >
                {regLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Kirim
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailDrawer && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailDrawer(false)} />
          <div className="relative w-full max-w-md bg-[#1a1a24] border-l border-white/10 h-full overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/10 bg-[#1a1a24]">
              <h3 className="text-lg font-bold text-white">Detail User</h3>
              <button onClick={() => setShowDetailDrawer(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold text-white">
                  {selectedUser.name?.[0] || "?"}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">{selectedUser.name}</h4>
                  <p className="text-sm text-gray-400 font-mono">PIN: {selectedUser.pin}</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  ["Privilege", selectedUser.privilege === 14 ? "Admin" : "User Biasa"],
                  ["Jari", selectedUser.finger > 0 ? `${selectedUser.finger} jari` : "Tidak ada"],
                  ["Wajah", selectedUser.face > 0 ? "Ya" : "Tidak ada"],
                  ["Vein", selectedUser.vein > 0 ? "Ya" : "Tidak ada"],
                  ["RFID", selectedUser.rfid ? String(selectedUser.rfid) : "Tidak ada"],
                  ["Password", selectedUser.password || "Tidak ada"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-sm text-gray-400">{label}</span>
                    <span className="text-sm text-white">{value}</span>
                  </div>
                ))}
              </div>
              {selectedUser.template && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Template</span>
                    <button onClick={copyTemplate} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white">
                      {copiedTemplate ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedTemplate ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl text-xs text-gray-300 font-mono break-all max-h-32 overflow-y-auto">
                    {selectedUser.template}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowDetailDrawer(false); openRegisterModal(selectedUser); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-medium text-white transition-colors"
                >
                  <UserPlus className="w-4 h-4" /> Register Online
                </button>
                <button
                  onClick={() => { setShowDetailDrawer(false); openDeleteDialog(selectedUser); }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-gray-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
