import { useState } from "react";

const SYSTEM_PROMPT = `You are LandlordLens, an expert AI that analyses rental lease agreements and tenancy contracts. You specialise in Irish rental law and the Residential Tenancies Act, but can analyse leases from any country.

When given a lease or rental agreement, you must respond ONLY with a JSON object in this exact format:
{
  "score": <number 0-100, overall tenant-friendliness score>,
  "verdict": "<one sentence overall verdict>",
  "redFlags": [
    { "title": "<short title>", "detail": "<explanation of the problem and why it matters>", "severity": "<high|medium|low>" }
  ],
  "goodClauses": [
    { "title": "<short title>", "detail": "<explanation of why this is good for the tenant>" }
  ],
  "negotiationTips": [
    "<actionable tip the tenant should raise before signing>"
  ],
  "summary": "<2-3 sentence plain English summary of the overall lease>"
}

Be specific, practical, and tenant-focused. Flag anything unusual, potentially illegal, or unfair. For Irish leases, reference the RTB (Residential Tenancies Board) and relevant Irish law where applicable. Return ONLY the JSON, no markdown, no explanation.`;

const SAMPLE_LEASE = `RESIDENTIAL TENANCY AGREEMENT

This agreement is between John Murphy (Landlord) and the Tenant.

Property: 14 Clonliffe Road, Dublin 3
Monthly Rent: €1,650
Deposit: €3,300 (two months)
Lease Term: 12 months starting 1st July 2026

Terms and Conditions:
1. The tenant must give 3 months notice to vacate at any time during the tenancy.
2. The landlord may enter the property at any time with 12 hours notice for inspections.
3. No guests may stay more than 2 consecutive nights without written landlord permission.
4. The tenant is responsible for all repairs under €500.
5. Rent may be reviewed every 6 months at the landlord's discretion.
6. No pets allowed under any circumstances.
7. The tenant must maintain contents insurance at their own expense.
8. Sub-letting is strictly prohibited.
9. The deposit will be returned within 60 days of vacating, subject to deductions.
10. The tenant is liable for any damage caused by weather events.`;

export default function LandlordLens() {
  const [screen, setScreen] = useState("home"); // home | input | loading | results
  const [leaseText, setLeaseText] = useState("");
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("flags");
  const [error, setError] = useState(null);

  const analyseRelease = async (text) => {
    setScreen("loading");
    setError(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Analyse this lease agreement:\n\n${text}` }],
        }),
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResults(parsed);
      setScreen("results");
    } catch (e) {
      setError("Something went wrong analysing your lease. Please try again.");
      setScreen("input");
    }
  };

  const severityColor = (s) => {
    if (s === "high") return { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.35)", dot: "#ef4444", label: "#ef4444" };
    if (s === "medium") return { bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.35)", dot: "#fb923c", label: "#fb923c" };
    return { bg: "rgba(250,204,21,0.1)", border: "rgba(250,204,21,0.3)", dot: "#facc15", label: "#ca8a04" };
  };

  const scoreColor = (s) => {
    if (s >= 70) return "#4ade80";
    if (s >= 45) return "#fb923c";
    return "#ef4444";
  };

  const scoreLabel = (s) => {
    if (s >= 70) return "Tenant Friendly";
    if (s >= 45) return "Proceed with Caution";
    return "High Risk";
  };

  return (
    <div style={s.root}>
      <div style={s.grain} />
      <div style={s.glow} />

      <div style={s.card}>
        {screen === "home" && <HomeScreen onStart={() => setScreen("input")} />}
        {screen === "input" && (
          <InputScreen
            leaseText={leaseText}
            setLeaseText={setLeaseText}
            onAnalyse={() => analyseRelease(leaseText)}
            onSample={() => { setLeaseText(SAMPLE_LEASE); }}
            error={error}
          />
        )}
        {screen === "loading" && <LoadingScreen />}
        {screen === "results" && results && (
          <ResultsScreen
            results={results}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            severityColor={severityColor}
            scoreColor={scoreColor}
            scoreLabel={scoreLabel}
            onReset={() => { setResults(null); setLeaseText(""); setScreen("home"); }}
          />
        )}
      </div>
    </div>
  );
}

function HomeScreen({ onStart }) {
  return (
    <div style={s.screen}>
      <div style={s.badge}>🔍 AI-Powered</div>
      <h1 style={s.hero}>Know what you're signing<span style={s.dot}>.</span></h1>
      <p style={s.sub}>Paste your lease. Get instant red flags, hidden clauses, and negotiation tips — before you commit.</p>

      <div style={s.featureGrid}>
        {[
          { icon: "🚩", label: "Red flag detection" },
          { icon: "⚖️", label: "Irish law checked" },
          { icon: "💬", label: "Plain English results" },
          { icon: "🤝", label: "Negotiation tips" },
        ].map((f, i) => (
          <div key={i} style={s.featureChip}>
            <span>{f.icon}</span>
            <span style={s.featureLabel}>{f.label}</span>
          </div>
        ))}
      </div>

      <button style={s.primaryBtn} onClick={onStart}>Analyse my lease →</button>

      <p style={s.footnote}>🔒 Your lease text is never stored or shared</p>
    </div>
  );
}

function InputScreen({ leaseText, setLeaseText, onAnalyse, onSample, error }) {
  return (
    <div style={s.screen}>
      <div style={s.inputHeader}>
        <h2 style={s.inputTitle}>Paste your lease</h2>
        <button style={s.sampleBtn} onClick={onSample}>Try a sample</button>
      </div>
      <p style={s.inputSub}>Copy and paste the full text of your rental agreement below.</p>

      <textarea
        style={s.textarea}
        placeholder="Paste your lease agreement here..."
        value={leaseText}
        onChange={(e) => setLeaseText(e.target.value)}
      />

      {error && <p style={s.errorMsg}>{error}</p>}

      <div style={s.charCount}>{leaseText.length} characters</div>

      <button
        style={{ ...s.primaryBtn, opacity: leaseText.length < 50 ? 0.4 : 1, cursor: leaseText.length < 50 ? "not-allowed" : "pointer" }}
        onClick={onAnalyse}
        disabled={leaseText.length < 50}
      >
        Analyse lease →
      </button>

      <p style={s.footnote}>Works best with full lease text. Even partial text gives useful results.</p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ ...s.screen, alignItems: "center", justifyContent: "center", gap: "24px" }}>
      <div style={s.spinnerWrap}>
        <div style={s.spinner} />
        <span style={s.spinnerIcon}>📄</span>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={s.loadingTitle}>Reading your lease...</p>
        <p style={s.loadingSub}>Checking for red flags, hidden clauses, and tenant rights</p>
      </div>
      <div style={s.loadingSteps}>
        {["Parsing clauses", "Checking Irish law", "Scoring fairness", "Building report"].map((step, i) => (
          <div key={i} style={{ ...s.loadingStep, animationDelay: `${i * 0.4}s` }}>
            <span style={s.stepDot} />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsScreen({ results, activeTab, setActiveTab, severityColor, scoreColor, scoreLabel, onReset }) {
  const col = scoreColor(results.score);
  const tabs = [
    { id: "flags", label: `🚩 Red Flags (${results.redFlags?.length || 0})` },
    { id: "good", label: `✅ Good Clauses (${results.goodClauses?.length || 0})` },
    { id: "tips", label: `💡 Tips (${results.negotiationTips?.length || 0})` },
  ];

  return (
    <div style={s.resultsScreen}>
      {/* Score header */}
      <div style={{ ...s.scoreHeader, borderBottom: `3px solid ${col}20` }}>
        <div style={s.scoreLeft}>
          <div style={{ ...s.scoreBig, color: col }}>{results.score}</div>
          <div style={s.scoreMax}>/100</div>
        </div>
        <div style={s.scoreRight}>
          <div style={{ ...s.scoreLabel, color: col }}>{scoreLabel(results.score)}</div>
          <div style={s.scoreVerdict}>{results.verdict}</div>
        </div>
      </div>

      {/* Summary */}
      <div style={s.summaryBox}>
        <p style={s.summaryText}>{results.summary}</p>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {tabs.map((t) => (
          <button
            key={t.id}
            style={{ ...s.tab, ...(activeTab === t.id ? s.tabActive : {}) }}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={s.tabContent}>
        {activeTab === "flags" && (
          <div style={s.list}>
            {results.redFlags?.length === 0 && <p style={s.emptyState}>No major red flags found 🎉</p>}
            {results.redFlags?.map((f, i) => {
              const c = severityColor(f.severity);
              return (
                <div key={i} style={{ ...s.flagCard, background: c.bg, border: `1px solid ${c.border}` }}>
                  <div style={s.flagTop}>
                    <span style={{ ...s.severityDot, background: c.dot }} />
                    <span style={s.flagTitle}>{f.title}</span>
                    <span style={{ ...s.severityBadge, color: c.label, borderColor: c.border }}>{f.severity}</span>
                  </div>
                  <p style={s.flagDetail}>{f.detail}</p>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "good" && (
          <div style={s.list}>
            {results.goodClauses?.length === 0 && <p style={s.emptyState}>No notably good clauses found.</p>}
            {results.goodClauses?.map((g, i) => (
              <div key={i} style={{ ...s.flagCard, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)" }}>
                <div style={s.flagTop}>
                  <span style={{ ...s.severityDot, background: "#4ade80" }} />
                  <span style={s.flagTitle}>{g.title}</span>
                </div>
                <p style={s.flagDetail}>{g.detail}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "tips" && (
          <div style={s.list}>
            {results.negotiationTips?.map((tip, i) => (
              <div key={i} style={{ ...s.tipCard }}>
                <span style={s.tipNum}>{i + 1}</span>
                <p style={s.tipText}>{tip}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <button style={s.resetBtn} onClick={onReset}>← Analyse another lease</button>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = {
  root: {
    minHeight: "100vh",
    background: "#0a0c0f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    padding: "24px 16px",
    position: "relative",
    overflow: "hidden",
  },
  grain: {
    position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
  },
  glow: {
    position: "fixed", top: "-200px", right: "-200px",
    width: "600px", height: "600px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(234,179,8,0.07) 0%, transparent 65%)",
    pointerEvents: "none",
  },
  card: {
    width: "100%", maxWidth: "520px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    backdropFilter: "blur(20px)",
    boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
    overflow: "hidden",
    position: "relative", zIndex: 1,
  },
  screen: {
    padding: "40px 32px 32px",
    display: "flex", flexDirection: "column", gap: "20px",
  },
  badge: {
    alignSelf: "flex-start",
    background: "rgba(234,179,8,0.12)",
    border: "1px solid rgba(234,179,8,0.3)",
    color: "#eab308",
    fontSize: "12px", fontWeight: "600",
    padding: "4px 12px", borderRadius: "20px",
    letterSpacing: "0.5px",
  },
  hero: {
    margin: 0,
    fontSize: "clamp(28px, 5vw, 38px)",
    fontWeight: "800",
    color: "#f5f0e8",
    lineHeight: 1.15,
    letterSpacing: "-0.5px",
  },
  dot: { color: "#eab308" },
  sub: {
    margin: 0,
    fontSize: "15px", lineHeight: "1.65",
    color: "#9ca3af",
  },
  featureGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px",
  },
  featureChip: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px", padding: "12px 14px",
    display: "flex", alignItems: "center", gap: "10px",
  },
  featureLabel: { fontSize: "13px", color: "#d1d5db" },
  primaryBtn: {
    background: "#eab308",
    color: "#0a0c0f",
    border: "none", borderRadius: "14px",
    padding: "16px 24px",
    fontSize: "15px", fontWeight: "800",
    cursor: "pointer", fontFamily: "inherit",
    letterSpacing: "0.2px",
    transition: "transform 0.15s, opacity 0.15s",
  },
  footnote: {
    margin: 0, textAlign: "center",
    fontSize: "12px", color: "#4b5563",
  },

  // Input screen
  inputHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  inputTitle: { margin: 0, fontSize: "22px", fontWeight: "700", color: "#f5f0e8" },
  sampleBtn: {
    background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)",
    color: "#eab308", borderRadius: "8px", padding: "6px 12px",
    fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: "600",
  },
  inputSub: { margin: 0, fontSize: "14px", color: "#6b7280" },
  textarea: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "14px", padding: "16px",
    color: "#e5e7eb", fontSize: "13px",
    fontFamily: "monospace", lineHeight: "1.6",
    resize: "vertical", minHeight: "220px",
    outline: "none",
  },
  charCount: { fontSize: "11px", color: "#4b5563", textAlign: "right", marginTop: "-12px" },
  errorMsg: { color: "#ef4444", fontSize: "13px", margin: 0 },

  // Loading
  spinnerWrap: {
    position: "relative", width: "72px", height: "72px",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  spinner: {
    position: "absolute", inset: 0,
    border: "3px solid rgba(234,179,8,0.15)",
    borderTop: "3px solid #eab308",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  spinnerIcon: { fontSize: "28px", zIndex: 1 },
  loadingTitle: { margin: 0, fontSize: "20px", fontWeight: "700", color: "#f5f0e8" },
  loadingSub: { margin: "6px 0 0", fontSize: "14px", color: "#6b7280" },
  loadingSteps: { display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "260px" },
  loadingStep: {
    display: "flex", alignItems: "center", gap: "10px",
    fontSize: "13px", color: "#9ca3af",
    animation: "fadeIn 0.5s ease forwards", opacity: 0,
  },
  stepDot: {
    width: "6px", height: "6px", borderRadius: "50%",
    background: "#eab308", flexShrink: 0,
  },

  // Results
  resultsScreen: {
    display: "flex", flexDirection: "column",
  },
  scoreHeader: {
    padding: "28px 28px 20px",
    display: "flex", alignItems: "center", gap: "20px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  scoreLeft: { display: "flex", alignItems: "baseline", gap: "2px" },
  scoreBig: { fontSize: "56px", fontWeight: "800", lineHeight: 1 },
  scoreMax: { fontSize: "20px", color: "#4b5563", alignSelf: "flex-end", paddingBottom: "6px" },
  scoreRight: { flex: 1 },
  scoreLabel: { fontSize: "16px", fontWeight: "700", marginBottom: "4px" },
  scoreVerdict: { fontSize: "13px", color: "#9ca3af", lineHeight: "1.5" },
  summaryBox: {
    margin: "0 28px",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "12px",
    marginTop: "16px",
  },
  summaryText: { margin: 0, fontSize: "13px", color: "#9ca3af", lineHeight: "1.6" },

  // Tabs
  tabs: {
    display: "flex", gap: "0",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    marginTop: "16px", padding: "0 20px",
    overflowX: "auto",
  },
  tab: {
    background: "none", border: "none", borderBottom: "2px solid transparent",
    color: "#6b7280", fontSize: "12px", fontWeight: "600",
    padding: "10px 12px", cursor: "pointer",
    fontFamily: "inherit", whiteSpace: "nowrap",
    transition: "color 0.15s",
  },
  tabActive: { color: "#eab308", borderBottomColor: "#eab308" },
  tabContent: { padding: "16px 20px 8px", maxHeight: "340px", overflowY: "auto" },
  list: { display: "flex", flexDirection: "column", gap: "10px" },
  emptyState: { textAlign: "center", color: "#6b7280", fontSize: "14px", padding: "24px 0" },

  // Flag cards
  flagCard: {
    borderRadius: "12px", padding: "14px 16px",
    display: "flex", flexDirection: "column", gap: "8px",
  },
  flagTop: { display: "flex", alignItems: "center", gap: "8px" },
  severityDot: { width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  flagTitle: { fontSize: "14px", fontWeight: "700", color: "#f5f0e8", flex: 1 },
  severityBadge: {
    fontSize: "10px", fontWeight: "700", textTransform: "uppercase",
    border: "1px solid", borderRadius: "6px", padding: "2px 6px",
    letterSpacing: "0.5px",
  },
  flagDetail: { margin: 0, fontSize: "13px", color: "#9ca3af", lineHeight: "1.55", paddingLeft: "16px" },

  // Tips
  tipCard: {
    display: "flex", gap: "14px", alignItems: "flex-start",
    padding: "14px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  tipNum: {
    width: "24px", height: "24px", borderRadius: "50%",
    background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)",
    color: "#eab308", fontSize: "12px", fontWeight: "700",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  tipText: { margin: 0, fontSize: "13px", color: "#9ca3af", lineHeight: "1.6" },

  resetBtn: {
    margin: "12px 20px 20px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px", padding: "12px",
    color: "#6b7280", fontSize: "13px",
    cursor: "pointer", fontFamily: "inherit",
  },
};

// Inject keyframes
const styleTag = document.createElement("style");
styleTag.textContent = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { to { opacity: 1; } }
`;
document.head.appendChild(styleTag);
