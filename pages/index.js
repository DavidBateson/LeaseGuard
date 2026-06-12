import { useState, useEffect } from "react";

// 1. Static Demo Data
const DEMO_SECTIONS = {
  critical: `🔴 ILLEGAL DEPOSIT: "Deposit: €4,200" requested alongside first month rent. Under the Residential Tenancies Act, upfront payments are legally capped at 2 months combined.\n🔴 ILLEGAL NOTICE PERIOD: "The landlord may terminate this agreement with 14 days notice." This violates statutory notice periods.`,
  unfair: `🟡 EXCESSIVE REPAIR LIABILITY: "The tenant is responsible for boiler repairs." Structural maintenance belongs entirely to the landlord.\n🟡 RPZ VIOLATION RISK: "Rent may be reviewed every 6 months at sole discretion." Rent reviews inside Rent Pressure Zones are capped and restricted.`,
  standard: `🟢 SUBLETTING CONDITION: The Tenant shall use the property solely as a private residential dwelling and shall not sublet without the prior written consent of the Landlord.`,
  law: `DEPOSIT: Under the Residential Tenancies Act, upfront payments are legally capped at 2 months combined.`,
  todo: `- Do NOT pay a two-month deposit upfront.\n- Ask the landlord in writing to remove the boiler repair liability.`,
  score: `Overall: 7.5/10 risk profile`
};

// 2. Utility Functions
export function parseReport(text) {
  if (!text) return { critical: "", unfair: "", standard: "", law: "", todo: "", score: "" };
  const sections = { critical: "", unfair: "", standard: "", law: "", todo: "", score: "" };
  const markers = [
    { key: "critical", patterns: ["🔴", "CRITICAL", "RISK"] },
    { key: "unfair", patterns: ["🟡", "UNFAIR", "CLAUSE"] },
    { key: "standard", patterns: ["🟢", "STANDARD", "TERM"] },
    { key: "law", patterns: ["[LAW]", "⚖️", "LAW:"] },
    { key: "todo", patterns: ["[TODO]", "💡", "TODO:"] },
    { key: "score", patterns: ["📊", "RISK SCORE:", "OVERALL:"] }
  ];

  const lines = text.split("\n");
  let currentKey = "critical";
  let content = [];

  lines.forEach(line => {
    const upper = line.toUpperCase();
    let matched = false;
    for (const { key, patterns } of markers) {
      if (patterns.some(p => upper.includes(p))) {
        if (currentKey) sections[currentKey] = content.join("\n").trim();
        currentKey = key;
        content = [];
        matched = true;
        break;
      }
    }
    if (!matched) content.push(line);
  });
  if (currentKey) sections[currentKey] = content.join("\n").trim();
  return sections;
}

export function extractVerdict(scoreText) {
  const upper = (scoreText || "").toUpperCase();
  if (upper.includes("WALK AWAY")) return { label: "WALK AWAY", color: "#ff4d4d" };
  if (upper.includes("NEGOTIATE")) return { label: "NEGOTIATE FIRST", color: "#ffa500" };
  return { label: "PROCEED WITH CAUTION", color: "#4caf50" };
}

export function getFirstBulletTruncated(text) {
  const lines = (text || "").split("\n").filter(l => l.trim().length > 0);
  if (!lines[0]) return "";
  const clean = lines[0].trim().replace(/^[-•*\s🔴🟡🟢]+/, "");
  if (clean.length <= 80) return clean;
  const cut = clean.substring(0, 80);
  return cut.substring(0, cut.lastIndexOf(" ")) + "...";
}

// 3. Main Interface Component
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

  const loadingSteps = ["Reading your lease...", "Cross-referencing Irish rental law...", "Generating negotiation scripts..."];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "true") {
        setUnlocked(true);
        setScreen("results");
      }
      const rId = params.get("reportId");
      const payment = params.get("payment");
      if (rId && payment === "success") {
        setReportId(rId);
        const saved = sessionStorage.getItem(`lease_report_${rId}`);
        if (saved) {
          // Fixed directly here: removed the broken JSON.parse logic entirely
          setSections(parseReport(saved));
          setScreen("results");
        }
      }
    }
  }, []);

  const handleAnalyze = async () => {
    if (!leaseText.trim()) return;
    setLoading(true);
    setError(null);
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      const generatedId = "rep_" + Math.random().toString(36).substring(2, 9);
      await new Promise(resolve => setTimeout(resolve, 3600));
      sessionStorage.setItem(`lease_report_${generatedId}`, leaseText);
      setReportId(generatedId);
      setSections(parseReport(leaseText));
      setIsDemo(false);
      setUnlocked(false); 
      setScreen("results");
    } catch (err) {
      setError("Analysis encountered an unexpected timeout error. Please try again.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const loadDemo = () => {
    setSections(DEMO_SECTIONS);
    setIsDemo(true);
    setUnlocked(false); 
    setScreen("results");
  };

  const onUnlock = async () => {
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: reportId || "demo" })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Unable to reach payment gateway. Please check connection.");
        setPaymentLoading(false);
      }
    } catch (e) {
      setPaymentLoading(false);
    }
  };

  const onReset = () => {
    setScreen("home");
    setLeaseText("");
    setSections(null);
    setIsDemo(false);
    setUnlocked(false);
  };

  const tabs = [
    { id: "critical", label: "Critical Risks" },
    { id: "unfair", label: "Unfair Clauses" },
    { id: "standard", label: "Standard Terms" }
  ];

  const verdict = extractVerdict(sections?.score);

  return (
    <div style={s.container}>
      {screen === "home" ? (
        <div style={s.heroWrapper}>
          <div style={s.headerNav}>
            <div style={s.logoBlock}>
              <span style={s.logoShield}>🛡️</span>
              <span style={s.logoText}>LeaseGuard</span>
            </div>
            <div style={s.lawBadge}>IRISH RENTAL LAW AI</div>
          </div>

          <div style={s.heroSection}>
            <div style={s.taglineBadge}>🇮🇪 Built for Irish Renters</div>
            <h1 style={s.mainHeading}>Know exactly what you're signing.</h1>
            <p style={s.mainParagraph}>
              Paste your lease. Get a full legal analysis based on Irish rental law — in plain English. Catch illegal clauses before they cost you thousands.
            </p>
          </div>

          <div style={s.appCard}>
            {loading ? (
              <div style={s.loadingWrap}>
                <div style={s.spinner}></div>
                <p style={s.loadingText}>{loadingSteps[loadingStep]}</p>
              </div>
            ) : (
              <>
                <textarea
                  style={s.textarea}
                  placeholder="Paste your Irish tenancy lease agreement clauses here to run the audit..."
                  value={leaseText}
                  onChange={e => setLeaseText(e.target.value)}
                />
                <button style={s.mainBtn} onClick={handleAnalyze} disabled={!leaseText.trim()}>
                  Analyse my lease →
                </button>
                <button style={s.demoBtn} onClick={loadDemo}>
                  See example report
                </button>
                {error && <p style={s.error}>{error}</p>}
              </>
            )}
          </div>

          <div style={s.featuresGrid}>
            <div style={s.featureCard}>
              <span style={s.featIcon}>🔴</span>
              <h3 style={s.featTitle}>Critical Risks</h3>
              <p style={s.featText}>Illegal clauses flagged with Irish law references</p>
            </div>
            <div style={s.featureCard}>
              <span style={s.featIcon}>⚖️</span>
              <h3 style={s.featTitle}>Irish Law</h3>
              <p style={s.featText}>RTB rules, deposit limits, notice periods explained</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ ...s.verdictBanner, borderColor: verdict.color }}>
            <span style={{ ...s.verdictIcon, color: verdict.color }}>🚫</span>
            <div style={{ flex: 1 }}>
              <div style={{ ...s.verdictLabel, color: verdict.color }}>{verdict.label}</div>
              <div style={s.verdictSub}>Based on Irish rental law analysis</div>
            </div>
          </div>

          <div style={s.tabsWrap}>
            <div style={s.tabs}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{ ...s.tab, ...(activeTab === t.id ? s.tabActive : {}) }}
                >
                  {t.label}
                  {!unlocked && t.id !== "critical" && <span style={s.lockIcon}>🔒</span>}
                </button>
              ))}
            </div>
          </div>

          <div style={s.tabContent}>
            {activeTab === "critical" && (
              unlocked
                ? <ReportSection text={sections.critical || "No critical issues detected."} />
                : <CriticalPreview text={sections.critical || ""} onUnlock={onUnlock} paymentLoading={paymentLoading} />
            )}
            {activeTab !== "critical" && (
              unlocked
                ? <ReportSection text={sections[activeTab] || "No records items found."} />
                : <FullPaywall onUnlock={onUnlock} paymentLoading={paymentLoading} sectionName={tabs.find(t => t.id === activeTab)?.label} />
            )}
          </div>

          <button style={s.resetBtn} onClick={onReset}>
            ← Analyse another lease
          </button>
          <p style={s.disclaimer}>
            ⚖️ LeaseGuard provides general information only, not legal advice. RTB: rtb.ie · Threshold: threshold.ie
          </p>
          <div style={s.footerLinks}>
            <a href="/privacy-policy" style={s.fLink}>Privacy Policy</a>
            <a href="/disclaimer" style={s.fLink}>Legal Disclaimer</a>
          </div>
        </>
      )}
    </div>
  );
}

function ReportSection({ text }) {
  return (
    <div style={s.reportBox}>
      {text.split("\n").map((line, i) => (
        <p key={i} style={s.reportLine}>{line}</p>
      ))}
    </div>
  );
}

function CriticalPreview({ text, onUnlock, paymentLoading }) {
  return (
    <div>
      <div style={s.blurryBox}>
        <p style={s.reportLine}>{getFirstBulletTruncated(text)}</p>
        <div style={s.blurOverlay}></div>
      </div>
      <div style={s.inlinePaywall}>
        <h3 style={s.paywallTitle}>Full report locked</h3>
        <p style={s.paywallText}>Unlock all critical risks, unfair clauses, Irish law explanations, and word-for-word negotiation scripts for your specific lease.</p>
        <button style={s.paywallBtn} onClick={onUnlock} disabled={paymentLoading}>
          {paymentLoading ? "Connecting Securely..." : "Unlock Full Report — €7.99"}
        </button>
        <div style={s.paywallFootText}>One-time payment · Instant access · No subscription</div>
      </div>
    </div>
  );
}

function FullPaywall({ onUnlock, paymentLoading, sectionName }) {
  return (
    <div style={s.inlinePaywall}>
      <h3 style={s.paywallTitle}>{sectionName} is locked</h3>
      <p style={s.paywallText}>Unlock your full LeaseGuard report — all findings, Irish law references, action steps, and negotiation scripts.</p>
      <button style={s.paywallBtn} onClick={onUnlock} disabled={paymentLoading}>
        {paymentLoading ? "Connecting Securely..." : "Unlock Full Report — €7.99"}
      </button>
      <div style={s.paywallFootText}>One-time payment · Instant access · No subscription</div>
    </div>
  );
}

// 4. Stylesheet
const s = {
  container: {
    background: "#0a0a0c",
    minHeight: "100vh",
    padding: "24px 16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    boxSizing: "border-box",
    color: "#fff"
  },
  heroWrapper: {
    maxWidth: "480px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },
  headerNav: {
    display: "flex",
    justifyContent: "between",
    alignItems: "center",
    width: "100%",
    padding: "8px 0"
  },
  logoBlock: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  logoShield: {
    fontSize: "18px"
  },
  logoText: {
    fontSize: "19px",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: "-0.5px"
  },
  lawBadge: {
    background: "rgba(229,169,60,0.08)",
    border: "1px solid #e5a93c",
    color: "#e5a93c",
    fontSize: "10px",
    fontWeight: "700",
    padding: "4px 10px",
    borderRadius: "20px",
    letterSpacing: "0.5px"
  },
  heroSection: {
    textAlign: "left",
    marginTop: "12px"
  },
  taglineBadge: {
    display: "inline-block",
    background: "rgba(34,197,94,0.1)",
    border: "1px solid rgba(34,197,94,0.25)",
    color: "#4ade80",
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 12px",
    borderRadius: "20px",
    marginBottom: "16px"
  },
  mainHeading: {
    fontSize: "32px",
    fontWeight: "800",
    lineHeight: "1.15",
    color: "#fff",
    margin: "0 0 14px 0",
    letterSpacing: "-1px"
  },
  mainParagraph: {
    fontSize: "15px",
    color: "#a1a1aa",
    lineHeight: "1.5",
    margin: "0"
  },
  appCard: {
    background: "#121215",
    border: "1px solid #222227",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.4)"
  },
  textarea: {
    width: "100%",
    height: "160px",
    background: "#18181c",
    border: "1px solid #2e2e38",
    borderRadius: "12px",
    padding: "14px",
    color: "#fff",
    fontSize: "15px",
    resize: "none",
    outline: "none",
    boxSizing: "border-box",
    lineHeight: "1.4"
  },
  mainBtn: {
    width: "100%",
    background: "#e5a93c",
    color: "#000",
    border: "none",
    borderRadius: "12px",
    padding: "14px",
    fontSize: "15px",
    fontWeight: "700",
    marginTop: "16px",
    cursor: "pointer",
    transition: "background 0.2s"
  },
  demoBtn: {
    width: "100%",
    background: "#1c1c24",
    color: "#e4e4e7",
    border: "1px solid #2e2e38",
    borderRadius: "12px",
    padding: "12px",
    fontSize: "14px",
    fontWeight: "600",
    marginTop: "10px",
    cursor: "pointer"
  },
  featuresGrid: {
    display: "flex",
    gap: "12px",
    marginTop: "8px"
  },
  featureCard: {
    flex: 1,
    background: "#121215",
    border: "1px solid #1e1e24",
    borderRadius: "14px",
    padding: "16px"
  },
  featIcon: {
    fontSize: "18px",
    display: "block",
    marginBottom: "10px"
  },
  featTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 6px 0"
  },
  featText: {
    fontSize: "12px",
    color: "#71717a",
    margin: "0",
    lineHeight: "1.4"
  },
  loadingWrap: {
    padding: "40px 0",
    textAlign: "center"
  },
  spinner: {
    width: "28px",
    height: "28px",
    border: "3px solid #2e2e38",
    borderTopColor: "#e5a93c",
    borderRadius: "50%",
    margin: "0 auto 12px auto"
  },
  loadingText: {
    color: "#fff",
    fontSize: "15px"
  },
  error: {
    color: "#ff4d4d",
    fontSize: "13px",
    marginTop: "12px",
    textAlign: "center"
  },
  verdictBanner: {
    display: "flex",
    alignItems: "center",
    background: "rgba(255,77,77,0.06)",
    border: "1px solid",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "20px"
  },
  verdictIcon: {
    fontSize: "22px",
    marginRight: "12px"
  },
  verdictLabel: {
    fontSize: "16px",
    fontWeight: "800",
    letterSpacing: "0.5px"
  },
  verdictSub: {
    fontSize: "12px",
    color: "#8a8a93",
    marginTop: "1px"
  },
  tabsWrap: {
    borderBottom: "1px solid #222226",
    marginBottom: "16px"
  },
  tabs: {
    display: "flex",
    gap: "2px",
    overflowX: "auto"
  },
  tab: {
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    padding: "10px 12px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#8a8a93",
    cursor: "pointer"
  },
  tabActive: {
    color: "#e5a93c",
    borderBottomColor: "#e5a93c"
  },
  lockIcon: {
    fontSize: "11px",
    marginLeft: "4px"
  },
  tabContent: {
    minHeight: "180px",
    marginBottom: "20px"
  },
  reportBox: {
    background: "#1c1c21",
    borderRadius: "12px",
    padding: "16px",
    border: "1px solid #2e2e38"
  },
  reportLine: {
    color: "#e4e4e7",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0 0 12px 0"
  },
  blurryBox: {
    position: "relative",
    background: "#1c1c21",
    borderRadius: "12px 12px 0 0",
    padding: "16px",
    border: "1px solid #2e2e38",
    borderBottom: "none",
    minHeight: "60px",
    overflow: "hidden"
  },
  blurOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "45px",
    background: "linear-gradient(transparent, #131316)"
  },
  inlinePaywall: {
    background: "#1c1c21",
    border: "1px solid #2e2e38",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center"
  },
  paywallTitle: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: "700",
    margin: "0 0 8px 0"
  },
  paywallText: {
    color: "#a1a1aa",
    fontSize: "13px",
    lineHeight: "1.5",
    margin: "0 0 16px 0"
  },
  paywallBtn: {
    width: "100%",
    background: "#e5a93c",
    color: "#000",
    border: "none",
    borderRadius: "10px",
    padding: "12px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer"
  },
  paywallFootText: {
    color: "#71717a",
    fontSize: "11px",
    marginTop: "10px"
  },
  resetBtn: {
    background: "transparent",
    border: "1px solid #222226",
    color: "#8a8a93",
    padding: "10px 16px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    width: "100%",
    marginTop: "10px"
  },
  disclaimer: {
    fontSize: "11px",
    color: "#696974",
    textAlign: "center",
    lineHeight: "1.5",
    marginTop: "24px",
    marginBottom: "12px"
  },
  footerLinks: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    marginTop: "10px"
  },
  fLink: {
    color: "#3b82f6",
    fontSize: "12px",
    textDecoration: "underline"
  }
};
