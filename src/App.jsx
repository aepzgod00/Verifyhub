import { useState, useRef, useCallback } from "react";
import "./App.css";

// ─── Constants ───────────────────────────────────────────────────
const DB_KEY = "verifyhub_v3_records";
const STATS_KEY = "verifyhub_v3_stats";

function loadRecords() { try { return JSON.parse(localStorage.getItem(DB_KEY) || "[]"); } catch { return []; } }
function saveRecords(r) { try { localStorage.setItem(DB_KEY, JSON.stringify(r)); } catch {} }
function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY) || "null"); } catch { return null; }
}
function saveStats(s) { try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch {} }
function getStats() {
  const saved = loadStats();
  if (saved) return saved;
  const s = { documents: 128, verified: 120, pending: 8, accuracy: 99.2 };
  saveStats(s); return s;
}

function getToday() {
  return new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}
function getTodayEn() {
  return new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
async function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("read failed"));
    r.readAsDataURL(file);
  });
}

// ─── Topbar ──────────────────────────────────────────────────────
function TopBar() {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div>
          <div className="brand-name">VERIFYHUB</div>
          <div className="brand-tagline">Freight Document Operations Platform</div>
        </div>
      </div>
      <div className="topbar-right">
        <div className="topbar-date">📅 {getTodayEn()}</div>
        <div className="user-chip">
          <div className="avatar">SB</div>
          <div>
            <div className="user-name">Seabra Team</div>
            <div className="user-dept">Import-Export Dept.</div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────
function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb">
      {items.map((item, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {i > 0 && <span className="bc-sep">›</span>}
          {item.onClick
            ? <a onClick={item.onClick}>{item.label}</a>
            : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

// ─── Drop Zone ────────────────────────────────────────────────────
function DropZone({ files, onFiles, accept, label }) {
  const [over, setOver] = useState(false);
  const ref = useRef();

  const handle = useCallback((rawFiles) => {
    const arr = Array.from(rawFiles).filter(f =>
      f.type.match(/pdf|png|jpeg/i) || f.name.match(/\.(pdf|png|jpg|jpeg)$/i)
    );
    if (arr.length) onFiles(arr);
  }, [onFiles]);

  const onDrop = e => {
    e.preventDefault(); setOver(false);
    handle(e.dataTransfer.files);
  };

  return (
    <div>
      <div
        className={`drop-zone${over ? " drag-over" : ""}`}
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        onClick={() => ref.current.click()}
      >
        <span className="drop-icon">📂</span>
        <div className="drop-label">ลากไฟล์มาวางตรงนี้</div>
        <div className="drop-sub">หรือ <span className="drop-browse">เลือกไฟล์จากเครื่อง</span></div>
        <div className="t-xs" style={{ color: "var(--muted)", marginTop: 6 }}>PDF · PNG · JPG</div>
        <input ref={ref} type="file" multiple accept={accept} style={{ display: "none" }}
          onChange={e => handle(e.target.files)} />
      </div>
      <div className="file-list">
        {files.length
          ? files.map(f => (
            <div key={f.name} className="file-item">
              <span className="file-item-icon">📄</span>
              <span className="file-item-name">{f.name}</span>
              <span className="file-item-size">{formatFileSize(f.size)}</span>
            </div>
          ))
          : <div className="no-files">ยังไม่มีไฟล์</div>}
      </div>
    </div>
  );
}

// ─── Portal Page ──────────────────────────────────────────────────
function Portal({ onNavigate }) {
  const stats = getStats();
  const today = getToday();

  return (
    <div>
      <Breadcrumb items={[{ label: "Home" }]} />
      <main className="main">
        <div className="welcome-section">
          <div className="welcome-left">
            <div className="welcome-meta">
              <span className="meta-dot"></span>
              <span className="t-xs" style={{ color: "var(--muted)" }}>2 Workspaces Available · {today}</span>
            </div>
            <div className="welcome-title">Welcome back.</div>
            <div className="welcome-sub" style={{ marginTop: 8 }}>Ready to verify your shipping documents.</div>
          </div>
        </div>

        <div className="stats-row">
          {[
            { label: "Documents", value: stats.documents, sub: "Total processed", icon: "📋" },
            { label: "Verified", value: stats.verified, sub: "Completed", icon: "✅" },
            { label: "Pending", value: stats.pending, sub: "Awaiting review", icon: "⏳" },
            { label: "Accuracy", value: stats.accuracy + "%", sub: "Overall rate", icon: "🎯" },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div className="stat-label">{s.label}</div>
                <span style={{ fontSize: 18, opacity: .7 }}>{s.icon}</span>
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="section-title">Workspaces</div>
        <div className="portal-grid">
          <div className="portal-card" onClick={() => onNavigate("audit")}>
            <div className="card-header">
              <div className="card-icon-wrap">🔍</div>
              <span className="card-badge-tag">Document Audit</span>
            </div>
            <div className="card-title">ตรวจสอบเอกสาร</div>
            <p className="card-desc">เปรียบเทียบข้อมูล B/L กับ Amendment อัตโนมัติ พร้อมรายงานผลแบบ field-by-field</p>
            <ul className="card-features">
              <li><span className="check-icon">✓</span> Bill of Lading (B/L)</li>
              <li><span className="check-icon">✓</span> Amendment Notice</li>
              <li><span className="check-icon">✓</span> Attached Sheet & ไฟล์แนบ</li>
            </ul>
            <button className="card-cta">เริ่มตรวจสอบเอกสาร <span className="arr">→</span></button>
          </div>

          <div className="portal-card" onClick={() => onNavigate("tracking")}>
            <div className="card-header">
              <div className="card-icon-wrap">📦</div>
              <span className="card-badge-tag">D/O Management</span>
            </div>
            <div className="card-title">บันทึกรับ D/O</div>
            <p className="card-desc">บันทึกและค้นหาประวัติการรับมอบเอกสาร D/O หน้าเคาน์เตอร์ พร้อม search realtime</p>
            <ul className="card-features">
              <li><span className="check-icon">✓</span> D/O Release Logging</li>
              <li><span className="check-icon">✓</span> Consignee Tracking</li>
              <li><span className="check-icon">✓</span> Quick Search History</li>
            </ul>
            <button className="card-cta">เปิดพื้นที่จัดการ D/O <span className="arr">→</span></button>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}

// ─── Parse AI JSON result ─────────────────────────────────────────
function parseResult(rawText) {
  try {
    const clean = rawText.replace(/```json|```/g, "").trim();
    const data = JSON.parse(clean);
    return Array.isArray(data) ? data : [data];
  } catch {
    return null;
  }
}

// ─── Result Display ───────────────────────────────────────────────
function ResultDisplay({ data, rawText }) {
  const parsed = parseResult(data || rawText);

  if (!parsed) {
    return (
      <div className="result-card">
        <div className="result-card-header">
          <span className="bl-number">ผลการตรวจสอบ</span>
        </div>
        <div style={{ padding: "20px", fontSize: 13, color: "var(--text-2)", whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
          {rawText}
        </div>
      </div>
    );
  }

  const totalMismatch = parsed.reduce((acc, bl) => acc + (bl.items || []).filter(i => i.status === "MISMATCH").length, 0);
  const totalItems = parsed.reduce((acc, bl) => acc + (bl.items || []).length, 0);
  const overallPass = totalMismatch === 0;

  function copyResult() {
    navigator.clipboard?.writeText(JSON.stringify(parsed, null, 2));
  }

  return (
    <div>
      {/* Banner */}
      <div className={`result-banner ${overallPass ? "pass" : totalMismatch <= 2 ? "warn" : "fail"}`}>
        <span className="banner-icon">{overallPass ? "✅" : totalMismatch <= 2 ? "⚠️" : "❌"}</span>
        <div>
          <div className="banner-title">
            {overallPass ? "Verification Completed — All documents are consistent." : `${totalMismatch} Mismatch${totalMismatch > 1 ? "es" : ""} Found — Review Required`}
          </div>
          <div className="banner-sub">Checked {totalItems} fields across {parsed.length} B/L document{parsed.length > 1 ? "s" : ""}</div>
        </div>
      </div>

      {/* Per-BL cards */}
      {parsed.map((bl, i) => {
        const mis = (bl.items || []).filter(x => x.status === "MISMATCH").length;
        return (
          <div key={i} className="result-card">
            <div className="result-card-header">
              <span className="bl-number">📋 {bl.bl || `Document ${i + 1}`}</span>
              <span className={`bl-status-badge ${mis === 0 ? "badge-pass" : "badge-fail"}`}>
                {mis === 0 ? "✓ PASS" : `✗ ${mis} MISMATCH`}
              </span>
            </div>
            <table className="result-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>ข้อมูล B/L</th>
                  <th>ข้อมูล Amend</th>
                  <th>Status</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {(bl.items || []).map((item, j) => (
                  <tr key={j}>
                    <td><span className="field-name">{item.field}</span></td>
                    <td><span className="field-value">{item.original}</span></td>
                    <td><span className="field-value">{item.amend}</span></td>
                    <td>
                      <span className={item.status === "MATCH" ? "badge-match" : item.status === "REVIEW" ? "badge-review" : "badge-mismatch"}>
                        {item.status === "MATCH" ? "🟢 MATCH" : item.status === "REVIEW" ? "🟡 REVIEW" : "🔴 MISMATCH"}
                      </span>
                    </td>
                    <td><span className="remark-text">{item.remark}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Summary card */}
      {parsed[0]?.summary && (
        <div className="summary-card">
          <div className="result-card-header">
            <span className="bl-number">📊 Weight & Volume Summary</span>
            <span className={`bl-status-badge ${parsed[0].summary.overall === "PASS" ? "badge-pass" : "badge-fail"}`}>
              Overall: {parsed[0].summary.overall}
            </span>
          </div>
          <div className="summary-grid">
            <div className="summary-item">
              <div className="summary-label">Gross Weight</div>
              <div className="summary-val">{parsed[0].summary.grossWeight?.total || "—"}</div>
              <div className="summary-calc">{parsed[0].summary.grossWeight?.calculation || ""}</div>
              <div style={{ marginTop: 8 }}>
                <span className={parsed[0].summary.grossWeight?.status === "MATCH" ? "badge-match" : "badge-mismatch"}>
                  {parsed[0].summary.grossWeight?.status === "MATCH" ? "🟢 MATCH" : "🔴 MISMATCH"}
                </span>
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Total CBM</div>
              <div className="summary-val">{parsed[0].summary.cbm?.total || "—"}</div>
              <div className="summary-calc">{parsed[0].summary.cbm?.calculation || ""}</div>
              <div style={{ marginTop: 8 }}>
                <span className={parsed[0].summary.cbm?.status === "MATCH" ? "badge-match" : "badge-mismatch"}>
                  {parsed[0].summary.cbm?.status === "MATCH" ? "🟢 MATCH" : "🔴 MISMATCH"}
                </span>
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Overall Result</div>
              <div style={{ fontSize: 36, margin: "8px 0" }}>{parsed[0].summary.overall === "PASS" ? "✅" : "❌"}</div>
              <div className="summary-calc">{parsed[0].summary.overall === "PASS" ? "All fields verified" : "Review required"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Export bar */}
      <div className="export-bar">
        <span className="label">Export:</span>
        <button className="btn btn-secondary" onClick={copyResult}>📋 Copy JSON</button>
        <button className="btn btn-secondary" onClick={() => {
          const txt = JSON.stringify(parsed, null, 2);
          const a = document.createElement("a");
          a.href = "data:text/json," + encodeURIComponent(txt);
          a.download = "verifyhub-result.json";
          a.click();
        }}>⬇ Download JSON</button>
        <button className="btn btn-secondary" onClick={() => window.print()}>🖨 Print Report</button>
      </div>
    </div>
  );
}

// ─── Audit Page ───────────────────────────────────────────────────
const LOADING_STAGES = [
  { label: "Extracting Document Data...", sub: "Reading B/L and Amendment files" },
  { label: "Comparing Fields...", sub: "Cross-referencing Consignee, Weight, Marks" },
  { label: "Calculating Totals...", sub: "Summing Gross Weight and CBM" },
  { label: "Generating Report...", sub: "Preparing structured output" },
];

function AuditPage({ onBack }) {
  const [blFiles, setBLFiles] = useState([]);
  const [amendFiles, setAmendFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadStage, setLoadStage] = useState(0);
  const [step, setStep] = useState(1);

  async function runAudit() {
    if (!blFiles.length || !amendFiles.length || loading) return;
    setLoading(true); setResult(null); setRawText(""); setStep(2);

    const stageTimer = setInterval(() => {
      setLoadStage(s => (s < LOADING_STAGES.length - 1 ? s + 1 : s));
    }, 1800);

    try {
      const content = [];
      for (const f of [...blFiles, ...amendFiles]) {
        const b64 = await fileToBase64(f);
        const mt = f.type || "application/pdf";
        content.push(mt === "application/pdf"
          ? { type: "document", source: { type: "base64", media_type: mt, data: b64 } }
          : { type: "image", source: { type: "base64", media_type: mt, data: b64 } });
      }

      content.push({ type: "text", text: `You are a logistics document compliance auditor for Seabra Trans Freight.
Analyze the uploaded B/L and Amendment documents carefully.

OUTPUT FORMAT: Respond ONLY with valid JSON, no markdown, no preamble.

JSON Structure:
[
  {
    "bl": "B/L number here",
    "items": [
      {
        "field": "Consignee",
        "original": "value from B/L",
        "amend": "value from Amendment",
        "status": "MATCH or MISMATCH or REVIEW",
        "remark": "brief explanation"
      }
    ]
  }
]

Include a "summary" object in the FIRST B/L entry:
"summary": {
  "grossWeight": {
    "total": "combined total",
    "calculation": "X KGS (BL-001) + Y KGS (BL-002) = Z KGS",
    "status": "MATCH or MISMATCH"
  },
  "cbm": {
    "total": "combined total",
    "calculation": "X CBM (BL-001) + Y CBM (BL-002) = Z CBM",
    "status": "MATCH or MISMATCH"
  },
  "overall": "PASS or FAIL"
}

AUDIT RULES:
- Consignee: match company name only, ignore address/building/zip
- Quantity: match numbers and units, ignore formatting
- Description: match core product names, ignore spacing
- Shipping Marks: exact match required
- Status options: MATCH, MISMATCH, REVIEW (use REVIEW when ambiguous)

Fields to check per B/L: Consignee, Quantity, Shipping Marks, Description of Goods, Gross Weight, CBM

Output ONLY the JSON array. Nothing else.` });

      const resp = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content }] }),
      });
      const data = await resp.json();
      const text = data.content?.map(b => b.text || "").join("\n") || "";
      setRawText(text);
      setResult(text);

      // Update stats
      const s = getStats();
      s.documents += blFiles.length;
      s.verified += blFiles.length;
      saveStats(s);
      setStep(3);
    } catch (e) {
      setRawText("เกิดข้อผิดพลาด: " + e.message);
      setStep(3);
    }
    clearInterval(stageTimer);
    setLoadStage(0);
    setLoading(false);
  }

  const canRun = blFiles.length > 0 && amendFiles.length > 0 && !loading;

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", onClick: onBack }, { label: "Document Verification" }]} />
      <main className="main">
        <div className="page-header">
          <div className="page-icon">🔍</div>
          <div>
            <div className="page-title-text">Automated Document Verification</div>
            <div className="page-sub">Compare B/L against Amendment — field-by-field with structured report</div>
          </div>
        </div>

        {/* Progress steps */}
        <div className="progress-steps" style={{ marginBottom: 24 }}>
          {[
            { n: 1, label: "Upload Files" },
            { n: 2, label: "Processing" },
            { n: 3, label: "Result" },
          ].map((s, i, arr) => (
            <span key={s.n} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <span className={`step ${step === s.n ? "active" : step > s.n ? "done" : ""}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="step-num">{step > s.n ? "✓" : s.n}</span>
                <span className="step-label">{s.label}</span>
              </span>
              {i < arr.length - 1 && <span className="step-divider" style={{ flex: 1 }}></span>}
            </span>
          ))}
        </div>

        <div className="upload-grid">
          <div>
            <div className="upload-col-label lbl-bl">📄 Bill of Lading (B/L)</div>
            <DropZone files={blFiles} onFiles={setBLFiles} accept=".pdf,.png,.jpg,.jpeg" label="B/L" />
          </div>
          <div>
            <div className="upload-col-label lbl-am">✏️ Amend & Attached Sheet</div>
            <DropZone files={amendFiles} onFiles={setAmendFiles} accept=".pdf,.png,.jpg,.jpeg" label="Amend" />
          </div>
        </div>

        <button className="btn btn-primary btn-full btn-lg" disabled={!canRun} onClick={runAudit}
          style={{ borderRadius: "100px" }}>
          {loading ? "⏳ กำลังประมวลผล..." : "ประมวลผลการเปรียบเทียบเอกสาร"}
        </button>

        {loading && (
          <div className="loading-box">
            <div className="loading-spinner"></div>
            <div className="loading-stage">{LOADING_STAGES[loadStage].label}</div>
            <div className="loading-sub">{LOADING_STAGES[loadStage].sub}</div>
          </div>
        )}

        {result && !loading && <div style={{ marginTop: 24 }}><ResultDisplay data={result} rawText={rawText} /></div>}

        <Footer />
      </main>
    </div>
  );
}

// ─── Tracking Page ────────────────────────────────────────────────
function TrackingPage({ onBack }) {
  const [records, setRecords] = useState(loadRecords());
  const [bl, setBL] = useState("");
  const [consignee, setConsignee] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2800); }

  function saveDO() {
    if (!bl.trim()) { showToast("⚠ โปรดกรอกหมายเลข B/L"); return; }
    const next = records.filter(r => r.bl !== bl.trim());
    next.push({ bl: bl.trim(), consignee: consignee.trim() || "ลูกค้าหน้าเคาน์เตอร์", date: getToday() });
    setRecords(next); saveRecords(next);
    setBL(""); setConsignee("");
    showToast("✓ บันทึก " + bl.trim() + " เรียบร้อยแล้ว");
  }

  function clearAll() {
    if (window.confirm("ยืนยันลบข้อมูลทั้งหมด?")) {
      setRecords([]); saveRecords([]);
      showToast("ล้างข้อมูลทั้งหมดแล้ว");
    }
  }

  const filtered = records.filter(r =>
    r.bl.toLowerCase().includes(search.toLowerCase()) ||
    r.consignee.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {toast && <div className="toast show">{toast}</div>}
      <Breadcrumb items={[{ label: "Home", onClick: onBack }, { label: "D/O Management" }]} />
      <main className="main">
        <div className="page-header">
          <div className="page-icon">📦</div>
          <div>
            <div className="page-title-text">D/O Release Management</div>
            <div className="page-sub">บันทึกและค้นหาประวัติการรับมอบเอกสาร Delivery Order</div>
          </div>
        </div>

        <div className="tracking-section-title"><span className="sec-dot"></span>บันทึกการรับ D/O</div>
        <div className="form-row">
          <div className="form-group">
            <label>หมายเลข Bill of Lading (B/L)</label>
            <input type="text" placeholder="เช่น PKELCH2660002" value={bl} onChange={e => setBL(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveDO()} />
          </div>
          <div className="form-group">
            <label>ชื่อบริษัทลูกค้า / Consignee</label>
            <input type="text" placeholder="เช่น SIAM LOGISTICS CO., LTD." value={consignee} onChange={e => setConsignee(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveDO()} />
          </div>
        </div>
        <button className="btn btn-primary" style={{ borderRadius: "100px", padding: "11px 28px" }} onClick={saveDO}>
          บันทึกการรับมอบเอกสาร
        </button>

        <hr className="divider" />

        <div className="tracking-section-title"><span className="sec-dot"></span>ค้นหาประวัติ</div>
        <div className="search-wrap">
          <span className="search-icon">🔎</span>
          <input type="text" placeholder="พิมพ์เลข B/L หรือชื่อ Consignee..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
          แสดง {filtered.length} รายการ {search && `(กรองจาก "${search}")`}
        </div>

        <div className="table-card">
          <table>
            <thead>
              <tr><th>เลขที่ B/L</th><th>Consignee</th><th>วันที่รับ D/O</th></tr>
            </thead>
            <tbody>
              {filtered.length ? filtered.map(r => (
                <tr key={r.bl}>
                  <td><strong style={{ fontFamily: "monospace", fontSize: 13 }}>{r.bl}</strong></td>
                  <td>{r.consignee}</td>
                  <td><span className="date-badge">{r.date}</span></td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="empty-row" style={{ textAlign: "center", color: "var(--muted)", padding: 48 }}>ยังไม่มีข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="danger-zone">
          <div className="danger-label">⚠ Administrator Zone</div>
          <button className="btn btn-danger" onClick={clearAll}>ล้างฐานข้อมูลทั้งหมด</button>
        </div>

        <Footer />
      </main>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-name">VERIFYHUB</div>
      <div className="footer-meta">Version 1.0 · Freight Document Operations Platform · Department of Logistics</div>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("portal");
  return (
    <div>
      <TopBar />
      {page === "portal"   && <Portal onNavigate={setPage} />}
      {page === "audit"    && <AuditPage onBack={() => setPage("portal")} />}
      {page === "tracking" && <TrackingPage onBack={() => setPage("portal")} />}
    </div>
  );
}