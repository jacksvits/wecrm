import { useState } from "react";

const TABS = [
  { key: "services", label: "Услуги", url: "https://welans.tochkaplace.com" },
  { key: "cartridges", label: "Картриджи", url: "https://wetoner.tochkaplace.com" },
];

export function Shop() {
  const [activeTab, setActiveTab] = useState("services");
  const current = TABS.find((t) => t.key === activeTab) || TABS[0];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 22, fontWeight: 600 }}>Магазин</h2>
        <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border-color)" }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "10px 16px",
                border: "none",
                background: activeTab === tab.key ? "var(--bg-hover)" : "transparent",
                color: activeTab === tab.key ? "#007AFF" : "var(--text-primary)",
                borderBottom: activeTab === tab.key ? "2px solid #007AFF" : "2px solid transparent",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                borderRadius: "8px 8px 0 0",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <iframe
        key={current.key}
        src={current.url}
        title={current.label}
        style={{
          flex: 1,
          width: "100%",
          border: "1px solid var(--border-color)",
          borderRadius: 12,
          background: "var(--bg-card)",
        }}
      />
    </div>
  );
}
