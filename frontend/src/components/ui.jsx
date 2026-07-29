export function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-ink text-white hover:bg-accentDark",
    accent: "bg-accent text-white hover:bg-accentDark",
    ghost: "bg-transparent text-ink hover:bg-line/60 border border-line",
    danger: "bg-transparent text-warn border border-warn/40 hover:bg-warn/5",
    orange: "bg-orange-500 text-white hover:bg-orange-600",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">{label}</span>}
      <input
        className={`w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/30 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none ${className}`}
        {...props}
      />
    </label>
  );
}

export function Select({ label, className = "", children, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink/60">{label}</span>}
      <select
        className={`w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-lg border border-line bg-panel p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-line/60 text-ink/70",
    good: "bg-good/10 text-good",
    warn: "bg-warn/10 text-warn",
    accent: "bg-accent/10 text-accent",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium font-mono ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <p className="rounded-md bg-warn/10 px-3 py-2 text-sm text-warn">{children}</p>;
}
