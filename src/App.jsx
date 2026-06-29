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

// ─── Vector SVG Components ────────────────────────────────────────
const SvgCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);
const SvgSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const SvgFolder = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
);
const SvgDocument = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);
const SvgBox = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
);
const SvgCheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);
const SvgXCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
);
const SvgAlertTriangle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);
const SvgHome = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);

// ─── Topbar ──────────────────────────────────────────────────────
function TopBar() {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
        </div>
        <div>
          <div className="brand-name">VERIFYHUB</div>
          <div className="brand-tagline">Freight Document Operations Platform</div>
        </div>
      </div>
      <div className="topbar-right">
        <div className="topbar-date">
          <SvgCalendar />
          <span>{getTodayEn()}</span>
        </div>
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
    e.preventDefault(); 
    e.stopPropagation(); 
    setOver(false);
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
        <span className="drop-icon"><SvgFolder /></span>
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
              <span className="file-item-icon"><SvgDocument /></span>
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

        <div className="section-title">Workspaces</div>
        <div className="portal-grid">
          <div className="portal-card" onClick={() => onNavigate("audit")}>
            <div className="card-header">
              <div className="card-icon-wrap"><SvgSearch /></div>
              <span className="card-badge-tag">Document Audit</span>
            </div>
            <div className="card-title">ตรวจสอบเอกสาร</div>
            <p className="card-desc">เปรียบเทียบข้อมูล B/L กับ Amendment อัตโนมัติ พร้อมรายงานผลแบบ field-by-field</p>
            <ul className="card-features">
              <li><span className="check-icon"><SvgCheckCircle /></span> Bill of Lading (B/L)</li>
              <li><span className="check-icon"><SvgCheckCircle /></span> Amendment Notice</li>
              <li><span className="check-icon"><SvgCheckCircle /></span> Attached Sheet & ไฟล์แนบ</li>
            </ul>
            <button className="card-cta">เริ่มตรวจสอบเอกสาร <span className="arr">→</span></button>
          </div>

          <div className="portal-card" onClick={() => onNavigate("tracking")}>
            <div className="card-header">
              <div className="card-icon-wrap"><SvgBox /></div>
              <span className="card-badge-tag">D/O Management</span>
            </div>
            <div className="card-title">บันทึกรับ D/O</div>
            <p className="card-desc">บันทึกและค้นหาประวัติการรับมอบเอกสาร D/O หน้าเคาน์เตอร์ พร้อม search realtime</p>
            <ul className="card-features">
              <li><span className="check-icon"><SvgCheckCircle /></span> D/O Release Logging</li>
              <li><span className="check-icon"><SvgCheckCircle /></span> Consignee Tracking</li>
              <li><span className="check-icon"><SvgCheckCircle /></span> Quick Search History</li>
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

// ─── Result Display (จุดที่แก้ไขประสิทธิภาพ UI/UX) ─────────────────────
function SummarySection({ summary }) {
  if (!summary) return null;
  return (
    <div className="bl-summary-section" style={{ marginTop: "24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "24px" }}>
      <div className="bl-summary-title" style={{ fontSize: "16px", fontWeight: "600", color: "var(--primary-h)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
        <SvgBox /> Weight & Volume Summary
      </div>
      <div className="bl-summary-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
        
        <div className="bl-summary-item" style={{ background: "var(--bg)", padding: "16px", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
          <div className="summary-label" style={{ fontSize: "12px", color: "var(--muted)", fontWeight: "600", textTransform: "uppercase" }}>Gross Weight</div>
          <div className="summary-val" style={{ fontSize: "20px", fontWeight: "600", color: "var(--text)", margin: "8px 0" }}>{summary.grossWeight?.total || "—"}</div>
          <div className="summary-calc" style={{ fontSize: "12px", color: "var(--text-2)", fontFamily: "monospace" }}>{summary.grossWeight?.calculation || ""}</div>
          <div style={{ marginTop: 12 }}>
            <span className={`status-indicator ${summary.grossWeight?.status?.toLowerCase()}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", padding: "4px 10px", borderRadius: "100px", background: summary.grossWeight?.status === "MATCH" ? "var(--success-l)" : "var(--error-l)", color: summary.grossWeight?.status === "MATCH" ? "var(--success)" : "var(--error)" }}>
              {summary.grossWeight?.status === "MATCH" ? <SvgCheckCircle /> : <SvgAlertTriangle />}
              {summary.grossWeight?.status}
            </span>
          </div>
        </div>

        <div className="bl-summary-item" style={{ background: "var(--bg)", padding: "16px", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
          <div className="summary-label" style={{ fontSize: "12px", color: "var(--muted)", fontWeight: "600", textTransform: "uppercase" }}>Total CBM</div>
          <div className="summary-val" style={{ fontSize: "20px", fontWeight: "600", color: "var(--text)", margin: "8px 0" }}>{summary.cbm?.total || "—"}</div>
          <div className="summary-calc" style={{ fontSize: "12px", color: "var(--text-2)", fontFamily: "monospace" }}>{summary.cbm?.calculation || ""}</div>
          <div style={{ marginTop: 12 }}>
            <span className={`status-indicator ${summary.cbm?.status?.toLowerCase()}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", padding: "4px 10px", borderRadius: "100px", background: summary.cbm?.status === "MATCH" ? "var(--success-l)" : "var(--error-l)", color: summary.cbm?.status === "MATCH" ? "var(--success)" : "var(--error)" }}>
              {summary.cbm?.status === "MATCH" ? <SvgCheckCircle /> : <SvgAlertTriangle />}
              {summary.cbm?.status}
            </span>
          </div>
        </div>

        <div className="bl-summary-item bl-summary-overall" style={{ background: summary.overall === "PASS" ? "var(--success-l)" : "var(--error-l)", padding: "16px", borderRadius: "var(--r-md)", border: `1px solid ${summary.overall === "PASS" ? "var(--success)" : "var(--error-b)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div className="summary-label" style={{ fontSize: "11px", color: summary.overall === "PASS" ? "var(--success)" : "var(--error)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>Overall Result</div>
          <div className={`overall-result-text`} style={{ fontSize: "24px", fontWeight: "700", color: summary.overall === "PASS" ? "var(--success)" : "var(--error)", margin: "4px 0" }}>
            {summary.overall}
          </div>
          <div className="summary-calc" style={{ fontSize: "12px", color: summary.overall === "PASS" ? "var(--success)" : "var(--error)", opacity: 0.8 }}>
            {summary.overall === "PASS" ? "All fields verified" : "Review required"}
          </div>
        </div>

      </div>
    </div>
  );
}

function ResultDisplay({ data, rawText }) {
  const parsed = parseResult(data || rawText);

  if (!parsed) {
    return (
      <div className="result-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", marginTop: "24px" }}>
        <div className="result-card-header" style={{ padding: "16px 24px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
          <span className="bl-number" style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}><SvgDocument /> ผลการตรวจสอบ</span>
        </div>
        <div style={{ padding: "24px", fontSize: 13, color: "var(--text-2)", whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
          {rawText}
        </div>
      </div>
    );
  }

  const totalMismatch = parsed.reduce((acc, bl) => acc + (bl.items || []).filter(i => i.status === "MISMATCH").length, 0);
  const totalReview   = parsed.reduce((acc, bl) => acc + (bl.items || []).filter(i => i.status === "REVIEW").length, 0);
  const totalItems    = parsed.reduce((acc, bl) => acc + (bl.items || []).length, 0);
  const overallPass   = totalMismatch === 0;
  const globalSummary = parsed.find(bl => bl.summary)?.summary || null;

  return (
    <div style={{ marginTop: "28px" }}>
      {/* ── Banner สรุปผลด้านบนแบบอ่านง่าย ── */}
      <div className={`result-banner`} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px 24px", borderRadius: "var(--r-lg)", background: overallPass ? "var(--success-l)" : "var(--error-l)", border: `1px solid ${overallPass ? "var(--success)" : "var(--error-b)"}`, marginBottom: "24px" }}>
        <span className="banner-icon" style={{ color: overallPass ? "var(--success)" : "var(--error)", display: "flex" }}>
          {overallPass ? <SvgCheckCircle /> : <SvgXCircle />}
        </span>
        <div style={{ flex: 1 }}>
          <div className="banner-title" style={{ fontSize: "16px", fontWeight: "600", color: overallPass ? "var(--success)" : "var(--error)" }}>
            {overallPass ? "เอกสารสมบูรณ์ครบถ้วน — ข้อมูลตรงกันทั้งหมด" : `พบข้อมูลไม่ตรงกันจำนวน ${totalMismatch} จุด — โปรดตรวจสอบใบแก้ไข`}
          </div>
          <div className="banner-sub" style={{ fontSize: "13px", color: "var(--text-2)", marginTop: "2px" }}>
            ตรวจสอบทั้งสิ้น {totalItems} ฟิลด์ ในเอกสาร B/L จำนวน {parsed.length} ฉบับ {totalReview > 0 && `(มีฟิลด์ที่ต้องพิจารณาเพิ่ม ${totalReview} จุด)`}
          </div>
        </div>
        <div className="banner-stats" style={{ display: "flex", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "100px", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--success)" }}>{totalItems - totalMismatch - totalReview} MATCHED</span>
          {totalMismatch > 0 && <span style={{ fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "100px", background: "var(--error)", color: "white" }}>{totalMismatch} MISMATCH</span>}
        </div>
      </div>

      {/* ── Per-BL Cards ตารางแยกเปรียบเทียบทีละฉบับแบบชัดเจน ── */}
      {parsed.map((bl, i) => {
        return (
          <div key={i} className="result-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", marginBottom: "24px", boxShadow: "var(--shadow-sm)" }}>
            <div className="result-card-header" style={{ padding: "16px 24px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="bl-number" style={{ fontWeight: "600", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text)" }}>
                <SvgDocument /> B/L No: <strong style={{ fontFamily: "monospace", color: "var(--primary-h)" }}>{bl.blNumber || "ไม่ระบุ"}</strong>
              </span>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                Consignee: {bl.consignee || "—"}
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                    <th style={{ padding: "12px 18px", fontWeight: "600", color: "var(--text-2)", width: "20%" }}>หัวข้อเอกสาร (Field)</th>
                    <th style={{ padding: "12px 18px", fontWeight: "600", color: "var(--primary-h)", width: "35%" }}>ข้อมูลเดิมใน B/L</th>
                    <th style={{ padding: "12px 18px", fontWeight: "600", color: "var(--warning)", width: "35%" }}>ข้อมูลแก้ไข (Amendment Notice)</th>
                    <th style={{ padding: "12px 18px", fontWeight: "600", color: "var(--text-2)", width: "10%", textAlign: "center" }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {(bl.items || []).map((item, idx) => {
                    const isMismatch = item.status === "MISMATCH";
                    const isReview = item.status === "REVIEW";
                    
                    // ปรับสไตล์แถวตามความร้ายแรงเพื่อให้แยกแยะสายตาได้ทันที
                    let rowBg = "transparent";
                    if (isMismatch) rowBg = "var(--error-l)";
                    else if (isReview) rowBg = "var(--warning-l)";

                    return (
                      <tr key={idx} style={{ background: rowBg, borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}>
                        <td style={{ padding: "14px 18px", fontWeight: "600", color: "var(--text)" }}>
                          {item.field}
                        </td>
                        <td style={{ padding: "14px 18px", color: isMismatch ? "var(--text)" : "var(--text-2)", textDecoration: isMismatch ? "line-through" : "none", opacity: isMismatch ? 0.6 : 1, whiteSpace: "pre-wrap" }}>
                          {item.original || "—"}
                        </td>
                        <td style={{ padding: "14px 18px", color: isMismatch ? "var(--error)" : "var(--text)", fontWeight: isMismatch ? "600" : "normal", whiteSpace: "pre-wrap" }}>
                          {item.amended || "—"}
                        </td>
                        <td style={{ padding: "14px 18px", textAlign: "center" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", justifyCenter: "center", gap: "4px", fontSize: "11px", fontWeight: "700", padding: "4px 8px", borderRadius: "4px", background: isMismatch ? "var(--error-l)" : isReview ? "var(--warning-l)" : "var(--primary-l)", color: isMismatch ? "var(--error)" : isReview ? "var(--warning)" : "var(--primary)", border: `1px solid ${isMismatch ? "var(--error-b)" : "transparent"}` }}>
                            {isMismatch ? "❌ MISMATCH" : isReview ? "⚠️ REVIEW" : "✔️ MATCH"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* ── Summary ส่วนท้าย ── */}
      <SummarySection summary={globalSummary} />
    </div>
  );
}

// ─── Audit Page ───────────────────────────────────────────────────
function AuditPage({ onBack }) {
  const [blFiles, setBlFiles] = useState([]);
  const [amFiles, setAmFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [rawText, setRawText] = useState("");

  const runAudit = async () => {
    if (!blFiles.length || !amFiles.length) return;
    setLoading(true); setResult(null); setRawText("");

    try {
      const blBase64 = await fileToBase64(blFiles[0]);
      const amBase64 = await fileToBase64(amFiles[0]);

      const res = await fetch("https://round-block-b91c.back26.workers.dev/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blFileName: blFiles[0].name,
          blFileData: blBase64,
          amFileName: amFiles[0].name,
          amFileData: amBase64
        })
      });

      if (!res.ok) throw new Error("Server error: " + res.status);
      const data = await res.json();
      
      if (data.result) {
        setResult(data.result);
      } else if (data.text) {
        setRawText(data.text);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", onClick: onBack }, { label: "Document Audit" }]} />
      <main className="main">
        <div className="header-actions">
          <div className="page-header">
            <div className="page-icon"><SvgSearch /></div>
            <div>
              <h1 className="page-title-text">Document Audit Workspace</h1>
              <p className="page-sub">อัปโหลดเอกสารเพื่อเปรียบเทียบข้อมูลจำเพาะ</p>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onBack}>กลับหน้าหลัก</button>
        </div>

        <div className="upload-grid">
          <div>
            <div className="upload-col-label lbl-bl"><SvgDocument /> 1. ไฟล์เอกสาร B/L ตัวหลัก</div>
            <DropZone files={blFiles} onFiles={setBlFiles} accept=".pdf,image/*" />
          </div>
          <div>
            <div className="upload-col-label lbl-am"><SvgDocument /> 2. ไฟล์ใบแก้ไข Amendment Notice</div>
            <DropZone files={amFiles} onFiles={setAmFiles} accept=".pdf,image/*" />
          </div>
        </div>

        <div style={{ textAlign: "center", margin: "32px 0" }}>
          <button className="btn btn-primary btn-lg" onClick={runAudit} disabled={loading || !blFiles.length || !amFiles.length}>
            {loading ? "กำลังวิเคราะห์และเปรียบเทียบข้อมูล..." : "เริ่มกระบวนการตรวจสอบเอกสาร"}
          </button>
        </div>

        {(result || rawText) && <ResultDisplay data={result} rawText={rawText} />}
      </main>
    </div>
  );
}

// ─── Tracking Page ────────────────────────────────────────────────
function TrackingPage({ onBack }) {
  const [records, setRecords] = useState(loadRecords);
  const [search, setSearch] = useState("");
  const [bl, setBl] = useState("");
  const [consignee, setConsignee] = useState("");

  const stats = getStats();

  const addRecord = e => {
    e.preventDefault();
    if (!bl.trim() || !consignee.trim()) return;
    const newRecords = [{ bl: bl.toUpperCase(), consignee, date: getToday() }, ...records];
    setRecords(newRecords); saveRecords(newRecords);
    setBl(""); setConsignee("");
  };

  const clearAll = () => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างฐานข้อมูลประวัติทั้งหมด?")) {
      setRecords([]); saveRecords([]);
    }
  };

  const filtered = records.filter(r =>
    r.bl.toLowerCase().includes(search.toLowerCase()) ||
    r.consignee.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", onClick: onBack }, { label: "D/O Management" }]} />
      <main className="main">
        <div className="header-actions">
          <div className="page-header">
            <div className="page-icon"><SvgBox /></div>
            <div>
              <h1 className="page-title-text">Counter D/O Release Logs</h1>
              <p className="page-sub">บันทึกและตรวจสอบประวัติการปล่อยใบส่งมอบสินค้าประจำวัน</p>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onBack}>กลับหน้าหลัก</button>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 24, marginBottom: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--text)" }}>บันทึกรายการรับมอบ D/O ใหม่</div>
          <form onSubmit={addRecord} style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>เลขที่ B/L No.</label>
              <input type="text" value={bl} onChange={e => setBl(e.target.value)} placeholder="เช่น OOCL249001..." style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--r-sm)", border: "1px solid var(--border-s)", fontSize: 13, fontFamily: "monospace" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>ชื่อบริษัทผู้รับสินค้า (Consignee)</label>
              <input type="text" value={consignee} onChange={e => setConsignee(e.target.value)} placeholder="เช่น บริษัท ซีบรา ทรานส์ จำกัด..." style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--r-sm)", border: "1px solid var(--border-s)", fontSize: 13 }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: "11px 24px" }}>บันทึกข้อมูล</button>
          </form>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", marginBottom: 32 }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 600 }}>ประวัติการทำรายการในระบบ ({filtered.length} รายการ)</div>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาเลข B/L หรือชื่อบริษัท..." style={{ padding: "6px 14px", borderRadius: 100, border: "1px solid var(--border-s)", fontSize: 12, width: 240 }} />
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--bg)", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "12px 20px" }}>B/L Number</th>
                <th style={{ padding: "12px 20px" }}>Consignee Name</th>
                <th style={{ padding: "12px 20px" }}>Release Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? filtered.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "14px 20px" }}><strong style={{ fontFamily: "monospace", fontSize: 13 }}>{r.bl}</strong></td>
                  <td style={{ padding: "14px 20px" }}>{r.consignee}</td>
                  <td style={{ padding: "14px 20px" }}><span className="date-badge">{r.date}</span></td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="empty-row" style={{ textAlign: "center", color: "var(--muted)", padding: 48 }}>ยังไม่มีข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="danger-zone">
          <div className="danger-label"><SvgAlertTriangle /> Administrator Zone</div>
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

// ─── Root Component ────────────────────────────────────────────────
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