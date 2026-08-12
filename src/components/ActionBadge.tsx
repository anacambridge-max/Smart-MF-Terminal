"use client";

const ACTION_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  "STRONG BUY": { bg: "bg-green-900/60 border-green-500/40", text: "text-green-400", icon: "🟢" },
  "ACCUMULATE": { bg: "bg-blue-900/60 border-blue-500/40", text: "text-blue-400", icon: "🟢" },
  "WATCH": { bg: "bg-yellow-900/60 border-yellow-500/40", text: "text-yellow-400", icon: "🟡" },
  "WAIT": { bg: "bg-orange-900/60 border-orange-500/40", text: "text-orange-400", icon: "🟠" },
  "AVOID": { bg: "bg-red-900/60 border-red-500/40", text: "text-red-400", icon: "🔴" },
};

interface ActionBadgeProps {
  action: string;
  large?: boolean;
}

export default function ActionBadge({ action, large = false }: ActionBadgeProps) {
  const style = ACTION_STYLES[action] || ACTION_STYLES["WATCH"];
  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-md font-semibold tracking-wide ${style.bg} ${style.text} ${large ? "px-4 py-2 text-sm" : "px-2 py-0.5 text-xs"}`}>
      <span>{style.icon}</span>
      {action}
    </span>
  );
}
