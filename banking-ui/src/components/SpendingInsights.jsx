
// CONCEPT: importing specific components from recharts
// PieChart         → the chart container
// Pie              → the actual donut/pie shape
// Cell             → one slice of the pie (colored)
// Tooltip          → popup when hovering a slice
// ResponsiveContainer → makes chart resize with parent width
import {
  PieChart, Pie, Cell,
  Tooltip, ResponsiveContainer
} from "recharts";

// ============================================================
// CONCEPT: Component with props
// This component receives everything from AccountDetail.jsx
// Props:
//   transactions → array of transaction objects
//   darkMode     → boolean for theme
//   aiInsights   → string from Claude API (or null)
//   aiStatus     → "idle|loading|success|rate_limit|error|no_data|no_categories"
// ============================================================
export default function SpendingInsights({
  transactions,
  darkMode,
  aiInsights,
  aiStatus,
}) {

  // ============================================================
  // DARK MODE STYLES
  // ============================================================
  const text = darkMode ? "text-white" : "text-slate-800";
  const muted = darkMode ? "text-gray-500" : "text-slate-400";
  const card = darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200";
  const statBg = darkMode ? "bg-gray-800" : "bg-slate-50";

  // ============================================================
  // CATEGORY COLORS
  // Each category has a fixed color — consistent across the app
  // ============================================================
  const catColors = {
    FOOD: "#1D9E75",
    SHOPPING: "#378ADD",
    TRAVEL: "#EF9F27",
    ENTERTAINMENT: "#D4537E",
    UTILITIES: "#8B5CF6",
    HEALTHCARE: "#EC4899",
    EDUCATION: "#F97316",
    TRANSFER: "#64748b",
    OTHER: "#94a3b8",
  };

  // ============================================================
  // FILTER TO LAST 30 DAYS
  // Same logic as backend — filter on frontend for chart accuracy
  // ============================================================
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const last30 = transactions.filter(
    tx => new Date(tx.timestamp) >= thirtyDaysAgo
  );

  // ============================================================
  // BUILD CATEGORY DATA FOR CHART
  // CONCEPT: reduce() groups transactions by category
  // Starts with empty object {}
  // For each transaction → adds amount to that category key
  // Result: { FOOD: 960, SHOPPING: 720, TRAVEL: 480 }
  // ============================================================
  const categoryMap = last30.reduce((acc, tx) => {
    const cat = tx.category || "OTHER";
    acc[cat] = (acc[cat] || 0) + tx.amount;
    return acc;
  }, {});

  // Total spend across all categories
  const totalSpend = Object.values(categoryMap)
    .reduce((a, b) => a + b, 0);

  // CONCEPT: Object.entries() converts object to array of [key, value] pairs
  // Then map each to { name, value, percent } shape recharts needs
  const chartData = Object.entries(categoryMap)
    .map(([name, value]) => ({
      name,
      value,
      percent: totalSpend > 0
        ? Math.round((value / totalSpend) * 100)
        : 0,
    }))
    .sort((a, b) => b.value - a.value); // highest spend first

  // ============================================================
  // FORMAT HELPERS
  // ============================================================
  const formatAmount = (amt) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amt);

  // ============================================================
  // CUSTOM TOOLTIP
  // Shows when user hovers a donut slice
  // recharts passes { active, payload } automatically
  // active = true when hovering
  // payload = array of data for the hovered slice
  // ============================================================
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`rounded-lg border px-3 py-2 text-xs shadow-sm ${card}`}>
          <p className={`font-medium ${text}`}>{payload[0].name}</p>
          <p className={muted}>{formatAmount(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  // ============================================================
  // EMPTY STATE — no transactions in last 30 days
  // ============================================================
  if (chartData.length === 0) {
    return (
      <div className={`rounded-xl border p-4 ${card}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-sm font-medium ${text}`}>Spending insights</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            AI
          </span>
        </div>
        <p className={`text-xs ${muted}`}>
          No categorized transactions in the last 30 days.
          Add a category when making transactions.
        </p>
      </div>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className={`rounded-xl border p-4 ${card}`}>

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className={`text-sm font-medium ${text}`}>Spending insights</h2>
          <p className={`text-xs mt-0.5 ${muted}`}>Last 30 days</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
          AI
        </span>
      </div>

      {/* ── DONUT CHART + LEGEND ── */}
      <div className="flex items-center gap-4 mb-4">

        {/* DONUT CHART
            CONCEPT: ResponsiveContainer fills parent width automatically
            PieChart → Pie with innerRadius creates the donut hole
            innerRadius={38} outerRadius={56} → ring thickness = 18px
            startAngle={90} endAngle={-270} → starts from top, goes clockwise */}
        <div className="relative flex-shrink-0" style={{ width: 120, height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={56}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {/* CONCEPT: map each data item to a colored Cell
                    Cell fill comes from catColors based on category name */}
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={catColors[entry.name] || "#94a3b8"}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center text — total spend amount
              absolute positioning centers it inside the donut hole
              pointer-events-none prevents it from blocking chart hover */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className={`text-xs ${muted}`}>Total</p>
            <p className={`text-xs font-medium ${text}`}>
              {formatAmount(totalSpend)}
            </p>
          </div>
        </div>

        {/* LEGEND — one row per category */}
        <div className="flex-1 space-y-1.5">
          {chartData.map((cat) => (
            <div key={cat.name} className="flex items-center gap-2">
              {/* Color dot */}
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: catColors[cat.name] || "#94a3b8" }}
              />
              {/* Category name — capitalize first letter */}
              <span className={`text-xs flex-1 ${muted}`}>
                {cat.name.charAt(0) + cat.name.slice(1).toLowerCase()}
              </span>
              {/* Percentage */}
              <span className={`text-xs font-medium ${text}`}>
                {cat.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI INSIGHTS BOX ── */}
      <div className={`rounded-lg p-3 ${statBg}`}>

        {/* AI header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
          </div>
          <span className={`text-xs font-medium ${text}`}>AI analysis</span>
        </div>

        {/* CONCEPT: conditional rendering based on aiStatus
            Each status shows a different UI state */}

        {/* Loading — spinner while waiting for Claude */}
        {aiStatus === "loading" && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-emerald-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className={`text-xs ${muted}`}>Analysing your spending...</p>
          </div>
        )}

        {/* Success — show Claude insights
            CONCEPT: split by newline → render each as separate paragraph
            Claude returns insights separated by \n as instructed in prompt */}
        {aiStatus === "success" && aiInsights && (
          aiInsights.split("\n").filter(Boolean).map((insight, i) => (
            <p
              key={i}
              className={`text-xs leading-relaxed ${muted} ${i > 0 ? "mt-1.5" : ""}`}
            >
              {insight}
            </p>
          ))
        )}

        {/* Rate limit — free API tier exhausted */}
        {aiStatus === "rate_limit" && (
          <div className="flex items-start gap-2">
            <span className="text-amber-500 flex-shrink-0 text-sm">⚠</span>
            <div>
              <p className="text-xs font-medium text-amber-600">
                AI insights unavailable
              </p>
              <p className={`text-xs mt-0.5 ${muted}`}>
                Free API limit reached. Spending chart above is still accurate.
              </p>
            </div>
          </div>
        )}

        {/* No transactions in last 30 days */}
        {aiStatus === "no_data" && (
          <p className={`text-xs ${muted}`}>
            No transactions in the last 30 days to analyse.
          </p>
        )}

        {/* No categorized transactions */}
        {aiStatus === "no_categories" && (
          <p className={`text-xs ${muted}`}>
            Add categories to your transactions to see AI insights.
          </p>
        )}

        {/* Generic error */}
        {aiStatus === "error" && (
          <div className="flex items-start gap-2">
            <span className={`flex-shrink-0 text-sm ${muted}`}>ℹ</span>
            <p className={`text-xs ${muted}`}>
              AI analysis is temporarily unavailable.
              Your spending chart is still accurate.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}