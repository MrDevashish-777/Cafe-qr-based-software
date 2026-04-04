function normalizeStatus(status) {
  const value = String(status || "").toLowerCase().trim();
  return value === "baking" ? "preparing" : value;
}

const STATUS_STYLES = {
  pending: {
    card: "!border-slate-200/90 !bg-red-100 shadow-[0_20px_45px_-24px_rgba(239,68,68,0.24)]",
    header: "!border-slate-200/80 !bg-red-200/80",
    body: "!bg-red-100/95",
    panel: "border-slate-200/80 bg-red-50/80",
    pill: "!border-red-300 !bg-red-100 !text-red-900",
  },
  accepted: {
    card: "!border-slate-200/90 !bg-yellow-100 shadow-[0_20px_45px_-24px_rgba(234,179,8,0.24)]",
    header: "!border-slate-200/80 !bg-yellow-200/80",
    body: "!bg-yellow-100/95",
    panel: "border-slate-200/80 bg-yellow-50/80",
    pill: "!border-yellow-300 !bg-yellow-100 !text-yellow-900",
  },
  preparing: {
    card: "!border-slate-200/90 !bg-orange-100 shadow-[0_20px_45px_-24px_rgba(249,115,22,0.24)]",
    header: "!border-slate-200/80 !bg-orange-200/80",
    body: "!bg-orange-100/95",
    panel: "border-slate-200/80 bg-orange-50/80",
    pill: "!border-orange-300 !bg-orange-100 !text-orange-900",
  },
  ready: {
    card: "!border-slate-200/90 !bg-emerald-100 shadow-[0_20px_45px_-24px_rgba(16,185,129,0.24)]",
    header: "!border-slate-200/80 !bg-emerald-200/80",
    body: "!bg-emerald-100/95",
    panel: "border-slate-200/80 bg-emerald-50/80",
    pill: "!border-emerald-300 !bg-emerald-100 !text-emerald-900",
  },
  served: {
    card: "!border-slate-200/90 !bg-sky-100 shadow-[0_20px_45px_-24px_rgba(14,165,233,0.24)]",
    header: "!border-slate-200/80 !bg-sky-200/80",
    body: "!bg-sky-100/95",
    panel: "border-slate-200/80 bg-sky-50/80",
    pill: "!border-sky-300 !bg-sky-100 !text-sky-900",
  },
  paid: {
    card: "!border-slate-200/90 !bg-indigo-100 shadow-[0_20px_45px_-24px_rgba(99,102,241,0.24)]",
    header: "!border-slate-200/80 !bg-indigo-200/80",
    body: "!bg-indigo-100/95",
    panel: "border-slate-200/80 bg-indigo-50/80",
    pill: "!border-indigo-300 !bg-indigo-100 !text-indigo-900",
  },
  rejected: {
    card: "!border-slate-200/90 !bg-rose-100 shadow-[0_20px_45px_-24px_rgba(244,63,94,0.24)]",
    header: "!border-slate-200/80 !bg-rose-200/80",
    body: "!bg-rose-100/95",
    panel: "border-slate-200/80 bg-rose-50/80",
    pill: "!border-rose-300 !bg-rose-100 !text-rose-900",
  },
  default: {
    card: "!border-slate-200/90 !bg-white",
    header: "!border-slate-100 !bg-slate-50/50",
    body: "!bg-white/95",
    panel: "border-slate-100 bg-white/90",
    pill: "!border-slate-200 !bg-white !text-slate-800",
  },
};

export function getOrderStatusPalette(status) {
  const normalized = normalizeStatus(status);
  return {
    normalized,
    ...(STATUS_STYLES[normalized] || STATUS_STYLES.default),
  };
}
