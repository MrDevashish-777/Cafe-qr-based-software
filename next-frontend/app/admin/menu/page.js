"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { authHeaders, clearToken, getToken, getUser } from "../../../lib/auth";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import { Input, Textarea } from "../../../components/ui/Input";

function upsertById(list, item) {
  const idx = list.findIndex((x) => x._id === item._id);
  if (idx === -1) return [item, ...list];
  const copy = list.slice();
  copy[idx] = item;
  return copy;
}

export default function AdminMenuPage() {
  const user = getUser();
  const role = user?.role;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [adminCafeId, setAdminCafeId] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Drinks");
  const [type, setType] = useState("veg");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", price: "", category: "", type: "veg" });

  const listUrl = useMemo(() => {
    const qs = adminCafeId ? `?cafeId=${encodeURIComponent(adminCafeId)}` : "";
    return `/api/admin/menu${qs}`;
  }, [adminCafeId]);

  const stats = useMemo(() => {
    const total = items.length;
    const available = items.filter((i) => i.isAvailable).length;
    const categories = new Set(items.map((i) => i.category)).size;
    return { total, available, categories };
  }, [items]);

  const requireLogin = () => {
    const token = getToken();
    if (!token) {
      window.location.href = "/admin/login";
      return false;
    }
    if (role && role !== "cafe_admin" && role !== "super_admin") {
      window.location.href = "/admin/login";
      return false;
    }
    return true;
  };

  const load = async () => {
    if (!requireLogin()) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(listUrl, { headers: { ...authHeaders() } });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createItem = async (e) => {
    e.preventDefault();
    if (!requireLogin()) return;
    setLoading(true);
    setError("");
    try {
      const body = {
        name,
        description,
        price: Number(price),
        category,
        type,
        isAvailable: true,
      };
      if (role === "super_admin" && adminCafeId) body.cafeId = adminCafeId;

      const data = await apiFetch("/api/admin/menu", {
        method: "POST",
        headers: { ...authHeaders() },
        body: JSON.stringify(body),
      });
      setName("");
      setDescription("");
      setPrice("");
      setCategory("Drinks");
      setType("veg");
      setItems((prev) => upsertById(prev, data));
    } catch (e2) {
      setError(e2.message || "Failed to create item");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      name: item.name || "",
      description: item.description || "",
      price: String(item.price ?? ""),
      category: item.category || "",
      type: item.type || "veg",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", description: "", price: "", category: "", type: "veg" });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!requireLogin()) return;
    setLoading(true);
    setError("");
    try {
      const body = {
        name: editForm.name,
        description: editForm.description,
        price: Number(editForm.price),
        category: editForm.category,
        type: editForm.type,
      };
      if (role === "super_admin" && adminCafeId) body.cafeId = adminCafeId;

      const data = await apiFetch(`/api/admin/menu/${editingId}`, {
        method: "PUT",
        headers: { ...authHeaders() },
        body: JSON.stringify(body),
      });
      setItems((prev) => prev.map((x) => (x._id === data._id ? data : x)));
      cancelEdit();
    } catch (e) {
      setError(e.message || "Failed to update item");
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id) => {
    if (!requireLogin()) return;
    const ok = window.confirm("Delete this menu item?");
    if (!ok) return;
    setLoading(true);
    setError("");
    try {
      await apiFetch(`/api/admin/menu/${id}`, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (e) {
      setError(e.message || "Failed to delete item");
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (id) => {
    if (!requireLogin()) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/api/admin/menu/${id}/toggle`, {
        method: "PATCH",
        headers: { ...authHeaders() },
      });
      setItems((prev) => prev.map((x) => (x._id === data._id ? data : x)));
    } catch (e) {
      setError(e.message || "Failed to toggle availability");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-orange-700 shadow">
              Admin Menu Console
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900">Menu management</h1>
            <p className="mt-2 text-sm text-slate-600">Create, update, and publish dishes across your cafe.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 text-center">
              <div className="text-xl font-bold text-slate-900">{stats.total}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Items</div>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 text-center">
              <div className="text-xl font-bold text-slate-900">{stats.available}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Available</div>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 text-center">
              <div className="text-xl font-bold text-slate-900">{stats.categories}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Categories</div>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
          <Button
            variant="outline"
            onClick={() => {
              clearToken();
              window.location.href = "/admin/login";
            }}
          >
            Logout
          </Button>
        </div>

        {role === "super_admin" && (
          <Card className="border border-orange-100 shadow-xl">
            <CardContent>
              <div className="font-bold">Super Admin: choose a cafeId</div>
              <div className="text-sm text-gray-600 mt-1">Provide a cafeId to scope listing and writes.</div>
              <div className="mt-3 flex gap-2">
                <Input value={adminCafeId} onChange={(e) => setAdminCafeId(e.target.value)} placeholder="cafeId (ObjectId)" />
                <Button variant="outline" onClick={load} disabled={loading}>Load</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {error && <div className="text-red-700 font-semibold">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-6">
          <Card className="border border-orange-100 shadow-xl">
            <CardContent>
              <h2 className="text-xl font-bold mb-4">Add new item</h2>
              <form onSubmit={createItem} className="grid grid-cols-1 gap-3">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
                <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" type="number" required />
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" required />
                <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="Type (veg/non-veg)" />
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} />
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Create item"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-extrabold">Items</h2>
            {items.map((it) => {
              const editing = editingId === it._id;
              return (
                <Card key={it._id} className="border border-orange-100 shadow-lg">
                  <CardContent>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-extrabold text-lg text-slate-900">{it.name}</div>
                        <div className="text-sm text-slate-600">{it.category} - {it.type}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${it.isAvailable ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200"}`}>
                        {it.isAvailable ? "Available" : "Unavailable"}
                      </div>
                    </div>

                    {editing ? (
                      <div className="mt-4 space-y-2">
                        <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" />
                        <Input value={editForm.price} onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))} placeholder="Price" type="number" />
                        <Input value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))} placeholder="Category" />
                        <Input value={editForm.type} onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value }))} placeholder="Type (veg/non-veg)" />
                        <Textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" rows={3} />
                        <div className="flex gap-2">
                          <Button onClick={saveEdit} disabled={loading}>Save</Button>
                          <Button variant="outline" onClick={cancelEdit} disabled={loading}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mt-3 text-sm text-slate-700">{it.description || <span className="text-slate-500">No description</span>}</div>
                        <div className="mt-3 font-extrabold text-slate-900">INR {Number(it.price || 0).toFixed(2)}</div>
                      </>
                    )}

                    {!editing && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => toggleAvailability(it._id)} disabled={loading}>
                          {it.isAvailable ? "Mark unavailable" : "Mark available"}
                        </Button>
                        <Button variant="outline" onClick={() => startEdit(it)} disabled={loading}>Edit</Button>
                        <Button variant="outline" onClick={() => deleteItem(it._id)} disabled={loading}>Delete</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {!loading && items.length === 0 && (
              <div className="text-gray-700">No menu items yet.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
