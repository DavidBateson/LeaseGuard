import { useState, useEffect } from "react";

// ─── DEMO DATA (free, no API needed) ─────────────────────────────────────────
const DEMO_SECTIONS = {
  critical: `- ILLEGAL DEPOSIT: "Deposit: €3,300 (two months)" — Under the Residential Tenancies Act 2004, the maximum deposit a landlord can charge is ONE month's rent (€1,650). Charging two months is illegal. You are owed €1,650 back before you even move in.
- ILLEGAL NOTICE PERIOD: "The landlord may enter the property at any time with 12 hours notice" — Irish law requires a minimum of 24 hours written notice. This clause violates the Residential Tenancies Act and is unenforceable.
- UNFAIR TERMINATION: "The landlord reserves the right to terminate this agreement with 2 weeks notice" — After 6 months, you have Part 4 tenancy rights. The landlord cannot evict you without a valid legal reason and proper notice periods.`,
  unfair: `- EXCESSIVE REPAIR LIABILITY: "The tenant is responsible for all repairs under €500" — Landlords are legally responsible for structural repairs and maintaining appliances they provided. This clause is unfair and likely unenforceable.
- RPZ VIOLATION RISK: "Rent may be reviewed every 6 months at the landlord's discretion" — Dublin 3 is a Rent Pressure Zone. Rent can only increase by 2% per year maximum, not every 6 months at will.
- WEATHER DAMAGE LIABILITY: "The tenant is liable for any damage caused by weather events" — Structural weather damage is a landlord's responsibility under Irish law.`,
  standard: `- No sub-letting clause — completely standard in Irish leases.
- Contents insurance requirement — normal and reasonable, protects your belongings.
- No pets clause — enforceable and common in Irish residential tenancies.`,
  law: `DEPOSIT: Under the Residential Tenancies Act 2004, your landlord can only charge ONE month's rent as a deposit. The €3,300 deposit in this lease is illegal — you should only pay €1,650.

RENT PRESSURE ZONES: Dublin 3 is inside a Rent Pressure Zone. Rent can only go up by 2% per year — not every 6 months as this lease claims.

PART 4 RIGHTS: After 6 months of renting, you gain Part 4 tenancy rights. The landlord cannot evict you without a valid legal reason. The "2 weeks notice" termination clause is completely unenforceable after month 6.

ENTRY RIGHTS: Your landlord must give you at least 24 hours written notice before entering. The 12-hour notice in this lease is illegal.`,
  todo: `- Do NOT pay a two-month deposit. Say: "Under the Residential Tenancies Act, the maximum deposit is one month's rent. I'm happy to pay €1,650 but not €3,300."
- Ask the landlord in writing to change the entry notice clause to 24 hours minimum.
- Get confirmation in writing that rent increases will comply with RPZ rules (2% max per year).
- Request removal of the €500 repair liability clause.
- Do not sign until the illegal deposit amount is corrected.
- Take photos of everything on move-in day and email them to the landlord as a record.`,
  score: `Overall: 7.5/10 risk

• Financial Risk: 8/10 — Illegal deposit and unlimited repair costs could cost you thousands.
• Legal Risk: 9/10 — Multiple clauses directly violate Irish law including deposit rules and eviction rights.
• Tenant Fairness: 6/10 — Several clauses heavily favour the landlord beyond normal Irish leases.

VERDICT: NEGOTIATE FIRST — This lease has serious illegal clauses that must be corrected before signing.`,
};

function parseReport(text) {
  const sections = { critical: "", unfair: "", standard: "", law: "", todo: "", score: "" };
  const markers = [
    { key: "critical", emoji: "🔴" },
    { key: "unfair", emoji: "🟡" },
    { key: "standard", emoji: "🟢" },
{ key: "law", emoji: "[LAW]" },
{ key: "todo", emoji: "[TODO]" },
    { key: "score", emoji: "📊" },
  ];

  markers.forEach(({ key }, i) => {
    const startEmoji = markers[i].emoji;
    const endEmoji = markers[i + 1]?.emoji || null;
    const startIdx = text.indexOf(startEmoji);
    if (startIdx === -1) return;
    const lineEnd = text.indexOf("\n", startIdx);
    const contentStart = lineEnd === -1 ? startIdx + 2 : lineEnd + 1;
    const endIdx = endEmoji ? text.indexOf(endEmoji, contentStart) : text.length;
    sections[key] = text.slice(contentStart, endIdx === -1 ? text.length : endIdx).trim();
  });

  return sections;
}


function extractVerdict(scoreText) {
  if (scoreText.includes("WALK AWAY")) return { label: "WALK AWAY", color: "#ef4444", icon: "🚫" };
  if (scoreText.includes("NEGOTIATE FIRST")) return { label: "NEGOTIATE FIRST", color: "#fb923c", icon: "⚠️" };
  if (scoreText.includes("SIGN")) return { label: "SIGN", color: "#4ade80", icon: "✅" };
  return { label: "REVIEW CAREFULLY", color: "#fb923c", icon: "⚠️" };
}

function getFirstBulletTruncated(text) {
  const lines = text.split("\n").filter(l => l.trim().startsWith("-") || l.trim().startsWith("•"));
  if (!lines[0]) return "";
  const clean = lines[0].trim().replace(/^[-•]\s*/, "");
  if (clean.length <= 80) return clean;
  const cut = clean.substring(0, 80);
  return cut.substring(0, cut.lastIndexOf(" ")) + "...";
}

function generateReportId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default function LeaseGuard() {
  const [screen, setScreen] = useState("home");
  const [leaseText, setLeaseText] = useState("");
  const [sections, setSections] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState("critical");
  const [loadingStep, setLoadingStep] = useState(0);
  const [reportId, setReportId] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [shareMsg, setShareMsg] = useState("");

  const loadingSteps = ["Reading your lease...", "Checking Irish rental law...", "Scanning for RTB violations...", "Calculating risk score...", "Writing your report..."];

  // Check for payment success on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rId = params.get("reportId");
    const payment = params.get("payment");

    if (rId && payment === "success") {
      const saved = sessionStorage.getItem(`report_${rId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSections(parsed);
        setReportId(rId);
        setUnlocked(true);
        setScreen("results");
      }
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const loadDemo = () => {
    setSections(DEMO_SECTIONS);
    setIsDemo(true);
    setUnlocked(true);
    setActiveTab("critical");
    setScreen("results");
  };

  const analyseRelease = async (text) => {
    setLoading(true);
    setScreen("loading");
    setError(null);
    setIsDemo(false);
    setUnlocked(false);
    setLoadingStep(0);
    const interval = setInterval(() => setLoadingStep(s => Math.min(s + 1, loadingSteps.length - 1)), 1500);

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseText: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      const parsed = parseReport(data.report);
      const id = generateReportId();
      sessionStorage.setItem(`report_${id}`, JSON.stringify(parsed));
      setSections(parsed);
      setReportId(id);
      setScreen("results");
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
      setScreen("input");
    }
    clearInterval(interval);
    setLoading(false);
  };

  const handleUnlock = async () => {
    if (!reportId) return;
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (e) {
      alert("Payment setup failed. Please try again.");
    }
    setPaymentLoading(false);
  };

  const handleShare = () => {
    if (!reportId) return;
    const url = `${window.location.origin}/?reportId=${reportId}&payment=success`;
    navigator.clipboard.writeText(url).then(() => {
      setShareMsg("Link copied!");
      setTimeout(() => setShareMsg(""), 2000);
    });
  };

  return (
    <div style={s.root}>
      <div style={s.glowTop} />
      <div style={s.container}>
        <div style={s.header}>
          <div style={s.logo}>
            <span style={s.logoIcon}>🛡️</span>
            <span style={s.logoText}>LeaseGuard</span>
          </div>
          <div style={s.headerTag}>Irish Rental Law AI</div>
        </div>

        {screen === "home" && <HomeScreen onStart={() => setScreen("input")} onDemo={loadDemo} />}
        {screen === "input" && (
          <InputScreen leaseText={leaseText} setLeaseText={setLeaseText}
            onAnalyse={() => analyseRelease(leaseText)} onDemo={loadDemo} error={error} />
        )}
        {screen === "loading" && <LoadingScreen step={loadingStep} steps={loadingSteps} />}
        {screen === "results" && sections && (
          <ResultsScreen sections={sections} isDemo={isDemo} unlocked={unlocked}
            activeTab={activeTab} setActiveTab={setActiveTab}
            onUnlock={handleUnlock} paymentLoading={paymentLoading}
            onShare={handleShare} shareMsg={shareMsg}
            onReset={() => { setSections(null); setLeaseText(""); setUnlocked(false); setIsDemo(false); setReportId(null); setScreen("home"); }} />
        )}
      </div>
    </div>
  );
}

function HomeScreen({ onStart, onDemo }) {
  return (
    <div style={s.screen}>
      <div style={s.heroSection}>
        <div style={s.heroBadge}>🇮🇪 Built for Irish Renters</div>
        <h1 style={s.heroTitle}>Know exactly what<br />you're signing.</h1>
        <p style={s.heroSub}>Paste your lease. Get a full legal analysis based on Irish rental law — in plain English. Catch illegal clauses before they cost you thousands.</p>
        <div style={s.heroBtns}>
          <button style={s.primaryBtn} onClick={onStart}>Analyse my lease →</button>
          <button style={s.secondaryBtn} onClick={onDemo}>See example report</button>
        </div>
      </div>
      <div style={s.featureGrid}>
        {[
          { icon: "🔴", title: "Critical Risks", desc: "Illegal clauses flagged with Irish law references" },
          { icon: "⚖️", title: "Irish Law", desc: "RTB rules, deposit limits, notice periods explained" },
          { icon: "💡", title: "Action Steps", desc: "Exactly what to say to your landlord" },
          { icon: "📊", title: "Risk Score", desc: "Financial, legal and fairness rating out of 10" },
        ].map((f, i) => (
          <div key={i} style={s.featureCard}>
            <span style={s.featureIcon}>{f.icon}</span>
            <div style={s.featureTitle}>{f.title}</div>
            <div style={s.featureDesc}>{f.desc}</div>
          </div>
        ))}
      </div>
      <div style={s.legalNote}>🔒 Your lease is never stored · General information only, not legal advice</div>
    </div>
  );
}

function InputScreen({ leaseText, setLeaseText, onAnalyse, onDemo, error }) {
  return (
    <div style={s.screen}>
      <div style={s.inputTop}>
        <div>
          <h2 style={s.inputTitle}>Paste your lease</h2>
          <p style={s.inputSub}>Copy the full text of your rental agreement and paste it below.</p>
        </div>
        <button style={s.sampleBtn} onClick={onDemo}>See example</button>
      </div>
      <textarea style={s.textarea} placeholder="Paste your full lease agreement here..."
        value={leaseText} onChange={(e) => setLeaseText(e.target.value)} />
      {error && <div style={s.errorBox}>{error}</div>}
      <div style={s.inputFooter}>
        <span style={s.charCount}>{leaseText.length} characters</span>
        <button style={{ ...s.primaryBtn, opacity: leaseText.length < 50 ? 0.4 : 1, cursor: leaseText.length < 50 ? "not-allowed" : "pointer" }}
          onClick={onAnalyse} disabled={leaseText.length < 50}>
          Analyse lease →
        </button>
      </div>
    </div>
  );
}

function LoadingScreen({ step, steps }) {
  return (
    <div style={s.loadingScreen}>
      <div style={s.loadingIcon}>🛡️</div>
      <h2 style={s.loadingTitle}>Analysing your lease</h2>
      <p style={s.loadingStep}>{steps[step]}</p>
      <div style={s.loadingBar}>
        <div style={{ ...s.loadingFill, width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>
      <p style={s.loadingNote}>Checking against Irish rental law...</p>
    </div>
  );
}

function ResultsScreen({ sections, isDemo, unlocked, activeTab, setActiveTab, onUnlock, paymentLoading, onShare, shareMsg, onReset }) {
  const verdict = extractVerdict(sections.score);
  const tabs = [
    { id: "critical", label: "🔴 Critical Risks" },
    { id: "unfair", label: "🟡 Unfair Clauses" },
    { id: "standard", label: "🟢 Standard Terms" },
    { id: "law", label: "⚖️ Irish Law" },
    { id: "todo", label: "💡 What To Do" },
    { id: "score", label: "📊 Risk Score" },
  ];

  return (
    <div style={s.resultsScreen}>
      {isDemo && (
        <div style={s.demoBanner}>
          👋 This is a sample report based on a real Dublin lease. <span style={s.demoLink} onClick={onReset}>Analyse your own lease →</span>
        </div>
      )}
      <div style={{ ...s.verdictBanner, borderColor: `${verdict.color}40`, background: `${verdict.color}10` }}>
        <span style={s.verdictIcon}>{verdict.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ ...s.verdictLabel, color: verdict.color }}>{verdict.label}</div>
          <div style={s.verdictSub}>Based on Irish rental law analysis</div>
        </div>
        {unlocked && !isDemo && (
          <button style={s.shareBtn} onClick={onShare}>
            {shareMsg || "🔗 Share"}
          </button>
        )}
      </div>
      <div style={s.tabsWrap}>
        <div style={s.tabs}>
          {tabs.map(t => (
            <button key={t.id} style={{ ...s.tab, ...(activeTab === t.id ? s.tabActive : {}) }} onClick={() => setActiveTab(t.id)}>
              {t.label}
              {!unlocked && t.id !== "critical" && <span style={s.lockIcon}>🔒</span>}
            </button>
          ))}
        </div>
      </div>
      <div style={s.tabContent}>
        {activeTab === "critical" && (
          unlocked
            ? <ReportSection text={sections.critical} />
            : <CriticalPreview text={sections.critical} onUnlock={onUnlock} paymentLoading={paymentLoading} />
        )}
        {activeTab !== "critical" && (
          unlocked
            ? <ReportSection text={sections[activeTab]} />
            : <FullPaywall onUnlock={onUnlock} paymentLoading={paymentLoading} sectionName={tabs.find(t => t.id === activeTab)?.label} />
        )}
      </div>
      <button style={s.resetBtn} onClick={onReset}>← Analyse another lease</button>
      <p style={s.disclaimer}>⚖️ LeaseGuard provides general information only, not legal advice. Consult a solicitor for advice specific to your situation. RTB: rtb.ie · Threshold: threshold.ie</p>
    </div>
  );
}

function CriticalPreview({ text, onUnlock, paymentLoading }) {
  const truncated = getFirstBulletTruncated(text);
  return (
    <div style={s.criticalPreviewWrap}>
      <div style={s.criticalFirstItem}>
        <span style={s.bulletDot}>—</span>
        <div style={s.criticalFadeWrap}>
          <span style={s.bulletText}>{truncated}</span>
          <div style={s.criticalFade} />
        </div>
      </div>
      <div style={s.blurRows}>
        {[100, 85, 92, 75, 88, 70].map((w, i) => (
          <div key={i} style={{ ...s.blurRow, width: `${w}%` }} />
        ))}
      </div>
      <div style={s.paywallOverlay}>
        <div style={s.paywallLock}>🔒</div>
        <h3 style={s.paywallTitle}>Full report locked</h3>
        <p style={s.paywallSub}>Unlock all critical risks, unfair clauses, Irish law explanations, and word-for-word negotiation scripts for your specific lease.</p>
        <button style={s.unlockBtn} onClick={onUnlock} disabled={paymentLoading}>
          {paymentLoading ? "Loading..." : "Unlock Full Report — €4.99"}
        </button>
        <p style={s.paywallNote}>One-time payment · Instant access · No subscription</p>
      </div>
    </div>
  );
}

function FullPaywall({ onUnlock, paymentLoading, sectionName }) {
  return (
    <div style={s.fullPaywallWrap}>
      <div style={s.blurRowsFull}>
        {[100, 80, 92, 70, 85, 60, 90, 75].map((w, i) => (
          <div key={i} style={{ ...s.blurRow, width: `${w}%` }} />
        ))}
      </div>
      <div style={s.paywallOverlay}>
        <div style={s.paywallLock}>🔒</div>
        <h3 style={s.paywallTitle}>{sectionName} is locked</h3>
        <p style={s.paywallSub}>Unlock your full LeaseGuard report — all findings, Irish law references, action steps, and negotiation scripts.</p>
        <button style={s.unlockBtn} onClick={onUnlock} disabled={paymentLoading}>
          {paymentLoading ? "Loading..." : "Unlock Full Report — €4.99"}
        </button>
        <p style={s.paywallNote}>One-time payment · Instant access · No subscription</p>
      </div>
    </div>
  );
}

function ReportSection({ text }) {
  if (!text) return <p style={{ color: "#6b7280", fontSize: 14 }}>No content in this section.</p>;
  const clean = text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
  const lines = clean.split("\n").filter(l => {
    const t = l.trim();
    return t && t !== "-" && t !== "•";
  });
  return (
    <div style={s.reportSection}>
      {lines.map((line, i) => {
        const isBullet = line.trim().startsWith("-") || line.trim().startsWith("•");
        const isVerdict = line.trim().startsWith("VERDICT:");
        return (
          <div key={i} style={isBullet ? s.bulletLine : isVerdict ? s.verdictLine : s.normalLine}>
            {isBullet
              ? <><span style={s.bulletDot}>—</span><span style={s.bulletText}>{line.trim().replace(/^[-•]\s*/, "")}</span></>
              : <span style={isVerdict ? { color: "#eab308", fontWeight: 700 } : {}}>{line}</span>
            }
          </div>
        );
      })}
    </div>
  );
}


const s = {
  root: { minHeight: "100vh", background: "#0c0e12", fontFamily: "Georgia, serif", position: "relative", overflowX: "hidden" },
  glowTop: { position: "fixed", top: -150, left: "50%", transform: "translateX(-50%)", width: 700, height: 400, borderRadius: "50%", pointerEvents: "none", background: "radial-gradient(ellipse, rgba(234,179,8,0.07) 0%, transparent 70%)", zIndex: 0 },
  container: { maxWidth: 740, margin: "0 auto", padding: "0 20px 60px", position: "relative", zIndex: 1 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 0 28px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 32 },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { fontSize: 22 },
  logoText: { fontSize: 20, fontWeight: 800, color: "#f5f0e8", letterSpacing: "-0.5px" },
  headerTag: { fontSize: 11, color: "#eab308", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", border: "1px solid rgba(234,179,8,0.25)", padding: "4px 10px", borderRadius: 20, background: "rgba(234,179,8,0.08)" },
  screen: { display: "flex", flexDirection: "column", gap: 28 },
  heroSection: { display: "flex", flexDirection: "column", gap: 16 },
  heroBadge: { alignSelf: "flex-start", fontSize: 12, color: "#4ade80", fontWeight: 600, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", padding: "4px 12px", borderRadius: 20 },
  heroTitle: { margin: 0, fontSize: "clamp(30px, 5vw, 46px)", fontWeight: 800, color: "#f5f0e8", lineHeight: 1.1, letterSpacing: "-1px" },
  heroSub: { margin: 0, fontSize: 15, color: "#9ca3af", lineHeight: 1.7, maxWidth: 500 },
  heroBtns: { display: "flex", gap: 12, flexWrap: "wrap" },
  primaryBtn: { background: "#eab308", color: "#0c0e12", border: "none", borderRadius: 12, padding: "14px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },
  secondaryBtn: { background: "rgba(255,255,255,0.06)", color: "#d1d5db", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  featureGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  featureCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6 },
  featureIcon: { fontSize: 22 },
  featureTitle: { fontSize: 13, fontWeight: 700, color: "#f5f0e8" },
  featureDesc: { fontSize: 12, color: "#6b7280", lineHeight: 1.5 },
  legalNote: { fontSize: 11, color: "#4b5563", textAlign: "center" },
  inputTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 },
  inputTitle: { margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#f5f0e8" },
  inputSub: { margin: 0, fontSize: 13, color: "#6b7280" },
  sampleBtn: { background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)", color: "#eab308", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0 },
  textarea: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, padding: "16px", color: "#e5e7eb", fontSize: 13, fontFamily: "monospace", lineHeight: 1.7, resize: "vertical", minHeight: 260, outline: "none", width: "100%", boxSizing: "border-box" },
  errorBox: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "12px 16px", color: "#ef4444", fontSize: 13 },
  inputFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  charCount: { fontSize: 12, color: "#4b5563" },
  loadingScreen: { display: "flex", flexDirection: "column", alignItems: "center", gap: 18, padding: "60px 0", textAlign: "center" },
  loadingIcon: { fontSize: 52 },
  loadingTitle: { margin: 0, fontSize: 22, fontWeight: 700, color: "#f5f0e8" },
  loadingStep: { margin: 0, fontSize: 14, color: "#eab308" },
  loadingBar: { width: "100%", maxWidth: 280, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" },
  loadingFill: { height: "100%", background: "#eab308", borderRadius: 4, transition: "width 1.2s ease" },
  loadingNote: { margin: 0, fontSize: 12, color: "#4b5563" },
  resultsScreen: { display: "flex", flexDirection: "column", gap: 20 },
  demoBanner: { background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#d1d5db" },
  demoLink: { color: "#eab308", fontWeight: 700, cursor: "pointer" },
  verdictBanner: { borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, border: "1px solid" },
  verdictIcon: { fontSize: 36 },
  verdictLabel: { fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" },
  verdictSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  shareBtn: { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 14px", color: "#d1d5db", fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },
  tabsWrap: { overflowX: "auto" },
  tabs: { display: "flex", gap: 2, borderBottom: "1px solid rgba(255,255,255,0.07)", minWidth: "max-content" },
  tab: { background: "none", border: "none", borderBottom: "2px solid transparent", color: "#6b7280", fontSize: 12, fontWeight: 600, padding: "10px 14px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5 },
  tabActive: { color: "#eab308", borderBottomColor: "#eab308" },
  lockIcon: { fontSize: 10 },
  tabContent: { minHeight: 240 },
  reportSection: { display: "flex", flexDirection: "column", gap: 8, padding: "4px 0" },
  bulletLine: { display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  bulletDot: { color: "#eab308", fontWeight: 700, flexShrink: 0, marginTop: 1 },
  bulletText: { fontSize: 14, color: "#d1d5db", lineHeight: 1.65 },
  normalLine: { fontSize: 14, color: "#9ca3af", lineHeight: 1.65, padding: "2px 0" },
  verdictLine: { fontSize: 15, fontWeight: 700, color: "#eab308", padding: "10px 0 4px" },
  criticalPreviewWrap: { position: "relative" },
  criticalFirstItem: { display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0" },
  criticalFadeWrap: { position: "relative", overflow: "hidden", maxHeight: 48 },
  criticalFade: { position: "absolute", bottom: 0, left: 0, right: 0, height: 32, background: "linear-gradient(to bottom, rgba(12,14,18,0), rgba(12,14,18,1))" },
  blurRows: { display: "flex", flexDirection: "column", gap: 10, padding: "12px 0", filter: "blur(5px)", opacity: 0.2, pointerEvents: "none" },
  blurRow: { height: 13, background: "rgba(255,255,255,0.18)", borderRadius: 6 },
  paywallOverlay: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center", padding: "24px 20px 20px" },
  fullPaywallWrap: { position: "relative" },
  blurRowsFull: { display: "flex", flexDirection: "column", gap: 10, padding: "20px 0", filter: "blur(6px)", opacity: 0.2, pointerEvents: "none" },
  paywallLock: { fontSize: 32 },
  paywallTitle: { margin: 0, fontSize: 17, fontWeight: 700, color: "#f5f0e8" },
  paywallSub: { margin: 0, fontSize: 13, color: "#9ca3af", lineHeight: 1.6, maxWidth: 340 },
  unlockBtn: { background: "#eab308", color: "#0c0e12", border: "none", borderRadius: 12, padding: "13px 26px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },
  paywallNote: { margin: 0, fontSize: 11, color: "#4b5563" },
  resetBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 20px", color: "#6b7280", fontSize: 13, cursor: "pointer", fontFamily: "inherit", alignSelf: "flex-start" },
  disclaimer: { fontSize: 11, color: "#374151", lineHeight: 1.6, textAlign: "center" },
};
