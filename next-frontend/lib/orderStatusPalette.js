function normalizeStatus(status) {
  const value = String(status || "").toLowerCase().trim();
  return value === "baking" ? "preparing" : value;
}

const STATUS_STYLES = {
  pending: {
    cardClassName: "border-slate-200/90",
    panelClassName: "border-slate-200/80",
    pillClassName: "text-red-950",
    cardStyle: { backgroundColor: "#fecaca" },
    headerStyle: { backgroundColor: "#fca5a5" },
    bodyStyle: { backgroundColor: "#fecaca" },
    panelStyle: { backgroundColor: "#fee2e2" },
    pillStyle: { backgroundColor: "#fee2e2", borderColor: "#fca5a5" },
  },
  accepted: {
    cardClassName: "border-slate-200/90",
    panelClassName: "border-slate-200/80",
    pillClassName: "text-amber-950",
    cardStyle: { backgroundColor: "#fef08a" },
    headerStyle: { backgroundColor: "#fde047" },
    bodyStyle: { backgroundColor: "#fef08a" },
    panelStyle: { backgroundColor: "#fef9c3" },
    pillStyle: { backgroundColor: "#fef3c7", borderColor: "#facc15" },
  },
  preparing: {
    cardClassName: "border-slate-200/90",
    panelClassName: "border-slate-200/80",
    pillClassName: "text-orange-950",
    cardStyle: { backgroundColor: "#fed7aa" },
    headerStyle: { backgroundColor: "#fdba74" },
    bodyStyle: { backgroundColor: "#fed7aa" },
    panelStyle: { backgroundColor: "#ffedd5" },
    pillStyle: { backgroundColor: "#ffedd5", borderColor: "#fb923c" },
  },
  ready: {
    cardClassName: "border-slate-200/90",
    panelClassName: "border-slate-200/80",
    pillClassName: "text-emerald-950",
    cardStyle: { backgroundColor: "#bbf7d0" },
    headerStyle: { backgroundColor: "#86efac" },
    bodyStyle: { backgroundColor: "#bbf7d0" },
    panelStyle: { backgroundColor: "#dcfce7" },
    pillStyle: { backgroundColor: "#dcfce7", borderColor: "#4ade80" },
  },
  served: {
    cardClassName: "border-slate-200/90",
    panelClassName: "border-slate-200/80",
    pillClassName: "text-sky-950",
    cardStyle: { backgroundColor: "#bae6fd" },
    headerStyle: { backgroundColor: "#7dd3fc" },
    bodyStyle: { backgroundColor: "#bae6fd" },
    panelStyle: { backgroundColor: "#e0f2fe" },
    pillStyle: { backgroundColor: "#e0f2fe", borderColor: "#38bdf8" },
  },
  paid: {
    cardClassName: "border-slate-200/90",
    panelClassName: "border-slate-200/80",
    pillClassName: "text-indigo-950",
    cardStyle: { backgroundColor: "#c7d2fe" },
    headerStyle: { backgroundColor: "#a5b4fc" },
    bodyStyle: { backgroundColor: "#c7d2fe" },
    panelStyle: { backgroundColor: "#e0e7ff" },
    pillStyle: { backgroundColor: "#e0e7ff", borderColor: "#818cf8" },
  },
  rejected: {
    cardClassName: "border-slate-200/90",
    panelClassName: "border-slate-200/80",
    pillClassName: "text-rose-950",
    cardStyle: { backgroundColor: "#fecdd3" },
    headerStyle: { backgroundColor: "#fda4af" },
    bodyStyle: { backgroundColor: "#fecdd3" },
    panelStyle: { backgroundColor: "#ffe4e6" },
    pillStyle: { backgroundColor: "#ffe4e6", borderColor: "#fb7185" },
  },
  default: {
    cardClassName: "border-slate-200/90",
    panelClassName: "border-slate-100",
    pillClassName: "text-slate-800",
    cardStyle: { backgroundColor: "#ffffff" },
    headerStyle: { backgroundColor: "#f8fafc" },
    bodyStyle: { backgroundColor: "#ffffff" },
    panelStyle: { backgroundColor: "#ffffff" },
    pillStyle: { backgroundColor: "#ffffff", borderColor: "#cbd5e1" },
  },
};

export function getOrderStatusPalette(status) {
  const normalized = normalizeStatus(status);
  return {
    normalized,
    ...(STATUS_STYLES[normalized] || STATUS_STYLES.default),
  };
}
