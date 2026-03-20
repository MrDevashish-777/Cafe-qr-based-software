"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import { getToken, getUser } from "../../lib/auth";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";

export default function SuperAdminPage() {
  const token = getToken();
  const user = getUser();
  const role = user?.role || "";

  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [numberOfTables, setNumberOfTables] = useState(10);
  const [logoUrl, setLogoUrl] = useState("");
  const [brandImageUrl, setBrandImageUrl] = useState("");

  const baseCustomerUrl = useMemo(() => window.location.origin, []);

  const totals = useMemo(() => {
    const totalCafes = cafes.length;
    const totalTables = cafes.reduce((sum, cafe) => sum + Number(cafe.numberOfTables || 0), 0);
    return { totalCafes, totalTables };
  }, [cafes]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/cafe");
      setCafes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to fetch cafes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || (role && role !== "super_admin")) {
      window.location.href = "/super-admin/login";
      return;
    }
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiFetch("/api/cafe", {
        method: "POST",
        body: JSON.stringify({
          name,
          address,
          numberOfTables: Number(numberOfTables || 0),
          logoUrl,
          brandImageUrl,
        }),
      });
      setName("");
      setAddress("");
      setNumberOfTables(10);
      setLogoUrl("");
      setBrandImageUrl("");
      await load();
    } catch (e2) {
      setError(e2.message || "Failed to create cafe");
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
              Super Admin Console
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900">Cafe fleet overview</h1>
            <p className="mt-2 text-sm text-slate-600">Create, manage, and monitor every location from one control room.</p>
          </div>
          <div className="flex gap-4">
            <div className="rounded-2xl border border-orange-100 bg-white/80 px-5 py-3 text-center">
              <div className="text-xl font-bold text-slate-900">{totals.totalCafes}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Cafes</div>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white/80 px-5 py-3 text-center">
              <div className="text-xl font-bold text-slate-900">{totals.totalTables}</div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Tables</div>
            </div>
          </div>
        </header>

        {error && <div className="text-red-700 font-semibold">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
          <Card className="border border-orange-100 shadow-xl">
            <CardContent>
              <h2 className="text-xl font-bold mb-4">Add new cafe</h2>
              <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cafe name" required />
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
                <Input value={numberOfTables} onChange={(e) => setNumberOfTables(e.target.value)} type="number" min={0} placeholder="Number of tables" />
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="Logo URL" />
                <Input value={brandImageUrl} onChange={(e) => setBrandImageUrl(e.target.value)} placeholder="Brand image URL" />
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? "Working..." : "Create cafe"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-orange-100 shadow-xl">
            <CardContent>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Cafes ({cafes.length})</h2>
                <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
              </div>
              {loading ? (
                <div className="text-gray-700 mt-4">Loading...</div>
              ) : cafes.length === 0 ? (
                <div className="text-gray-700 mt-4">No cafes yet.</div>
              ) : (
                <div className="mt-4 grid gap-4">
                  {cafes.map((cafe) => (
                    <div key={cafe._id} className="rounded-2xl border border-orange-100 bg-white/80 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{cafe.name}</div>
                          <div className="text-sm text-slate-600">{cafe.address || "No address"}</div>
                        </div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-orange-600">Active</div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                        <span>Tables: {cafe.numberOfTables || 0}</span>
                        <a className="text-orange-600 font-semibold" href={`${baseCustomerUrl}/${cafe._id}?table=1`}>
                          Open customer URL
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
