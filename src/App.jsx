import { useState, useRef, useCallback, useMemo } from "react";
import "./App.css";

// ─── Constants & Database Helper ─────────────────────────────────
const DB_KEY = "verifyhub_v3_records";
function loadRecords() { try { return JSON.parse(localStorage.getItem(DB_KEY) || "[]"); } catch { return []; } }
function saveRecords(r) { try { localStorage.setItem(DB_KEY, JSON.stringify(r)); } catch {} }

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

// ─── Refactored Minimalist Professional Icons (Feather Style) ───
const Icons = {
  Home: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-10z"/></svg>,
  Doc: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Upload: () => <svg className="drop-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Alert: () => <svg className="banner-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  BackArrow: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  X: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
};

// ─── Topbar Subsystem (Enhanced Brand Prominence) ────────────────
function TopBar() {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div>
          <div className="brand-name">VERIFYHUB</div>
          <div className="brand-tagline">Document Verification System</div>
        </div>
      </div>
      <div className="topbar-right">
        <div className="topbar-date">Session: {getTodayEn()}</div>
        <div className="user-chip">
          <div className="avatar">SB</div>
          <div>
            <div className="user-name">Seabra Ops</div>
            <div className="user-dept">Import-Export Dept.</div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Breadcrumb Component ────────────────────────────────────────
function Breadcrumb({ items, onBackAction }) {
  return (
    <div className="breadcrumb-container">
      {onBackAction && (
        <button className="btn-back-nav" onClick={onBackAction}>
          <Icons.BackArrow /> กลับหน้าหลัก
        </button>
      )}
      <nav className="breadcrumb">
        {items.map((item, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {i > 0 && <span className="bc-sep">›</span>}
            {item.onClick ? <a onClick={item.onClick}>{item.label}</a> : <span>{item.label}</span>}
          </span>
        ))}
      </nav>
    </div>
  );
}

// ─── Drag and Drop Elements ──────────────────────────────────────
function DropZone({ files, onFiles, accept }) {
  const [over, setOver] = useState(false);
  const ref = useRef();

  const handle = useCallback((rawFiles) => {
    const arr = Array.from(rawFiles).filter(f =>
      f.type.match(/pdf|png|jpeg/i) || f.name.match(/\.(pdf|png|jpg|jpeg)$/i)
    );
    if (arr.length) onFiles(arr);
  }, [onFiles]);

  return (
    <div>
      <div
        className={`drop-zone${over ? " drag-over" : ""}`}
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files); }}
        onClick={() => ref.current.click()}
      >
        <Icons.Upload />
        <div className="drop-label">ลากและวางเอกสารของคุณลงที่นี่</div>
        <div className="drop-sub">หรือ <span className="drop-browse">คลิกเพื่อเลือกไฟล์</span></div>
        <input ref={ref} type="file" multiple accept={accept} style={{ display: "none" }} onChange={e => handle(e.target.files)} />
      </div>
      <div className="file-list">
        {files.length ? files.map(f => (
          <div key={f.name} className="file-item">
            <span className="file-item-name">{f.name}</span>
            <span className="file-item-size">{formatFileSize(f.size)}</span>
          </div>
        )) : <div className="no-files">ยังไม่ได้เพิ่มไฟล์แนบประกอบ</div>}
      </div>
    </div>
  );
}

// ─── Portal Control Console Workspace ─────────────────────────────
function Portal({ onNavigate }) {
  const today = getToday();

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      <main className="main">
        <div className="welcome-section">
          <div className="welcome-meta">
            <span className="meta-dot"></span>
            <span style={{ color: "var(--text-muted)", fontWeight: 700, fontSize: "11.5px", letterSpacing: "0.03em" }}>OPERATIONAL PANEL · {today}</span>
          </div>
          <div className="welcome-title">Welcome Back.</div>
          <div className="welcome-sub">Choose a workspace to continue your operations.</div>
        </div>

        <div className="section-title">Operational Workspaces</div>
        <div className="portal-grid">
          <div className="portal-card audit-theme" onClick={() => onNavigate("audit")}>
            <div className="card-header">
              <div className="card-icon-wrap"><Icons.Doc /></div>
              <span className="card-badge-tag">Compliance</span>
            </div>
            <div>
              <div className="card-title">ตรวจสอบเอกสาร (Automated Audit)</div>
              <p className="card-desc">เปรียบเทียบข้อมูลไฟล์สแกนและประมวลผลความถูกต้องเอกสารอัตโนมัติ</p>
              <ul className="card-features">
                <li><span className="check-icon-svg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></span> Bill of Lading Cross Verification</li>
                <li><span className="check-icon-svg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></span> Auto Mismatch Flagging Intelligence</li>
              </ul>
            </div>
            <button className="card-cta">Start Verification →</button>
          </div>

          <div className="portal-card tracking-theme" onClick={() => onNavigate("tracking")}>
            <div className="card-header">
              <div className="card-icon-wrap"><Icons.Home /></div>
              <span className="card-badge-tag">Operations</span>
            </div>
            <div>
              <div className="card-title">บันทึกปล่อย D/O</div>
              <p className="card-desc">บันทึกการปล่อยเอกสารหน้าเคาน์เตอร์ และค้นหาข้อมูลประวัติเพื่อตอบลูกค้าและเอเย่นต์</p>
              <ul className="card-features">
                <li><span className="check-icon-svg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></span> Delivery Order Manifest Indexing</li>
                <li><span className="check-icon-svg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></span> Consignee Realtime Storage Log</li>
              </ul>
            </div>
            <button className="card-cta">Open Workspace →</button>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}

// ─── Automated Audit Internal Module ──────────────────────────────
function AuditPage({ onBack }) {
  const [blFiles, setBLFiles] = useState([]);
  const [amendFiles, setAmendFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  function executeVerification() {
    setLoading(true);
    setShowResult(false);
    setTimeout(() => {
      setLoading(false);
      setShowResult(true);
    }, 1500);
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard", onClick: onBack }, { label: "Automated Audit Operations" }]} onBackAction={onBack} />
      <main className="main">
        <div className="page-header">
          <div className="page-icon"><Icons.Doc /></div>
          <div>
            <div className="page-title-text">Automated Document Verification</div>
            <div className="page-sub">Compare company name, shipping marks, weight and container volume across documents.</div>
          </div>
        </div>

        <div className="upload-grid">
          <div>
            <div className="upload-col-label lbl-bl">เอกสารต้นฉบับ Bill of Lading (B/L)</div>
            <DropZone files={blFiles} onFiles={setBLFiles} accept=".pdf,.png,.jpg,.jpeg" />
          </div>
          <div>
            <div className="upload-col-label lbl-am">Amend & Attached Sheet</div>
            <DropZone files={amendFiles} onFiles={setAmendFiles} accept=".pdf,.png,.jpg,.jpeg" />
          </div>
        </div>

        <button className="btn btn-primary btn-full btn-lg" disabled={!blFiles.length || !amendFiles.length} onClick={executeVerification}>
          ประมวลผลการเปรียบเทียบข้อมูลเอกสาร
        </button>

        {loading && (
          <div className="loading-box">
            <div className="loading-spinner"></div>
            <div className="loading-stage">กำลังประมวลผลวิเคราะห์ความสอดคล้องเอกสาร...</div>
          </div>
        )}

        {showResult && !loading && (
          <div style={{ marginTop: 32 }}>
            <div className="result-banner fail">
              <Icons.Alert />
              <div>
                <div className="banner-title">พบข้อผิดพลาด 1 จุดที่จำเป็นต้องได้รับการตรวจสอบใหม่ (Discrepancy Detected)</div>
                <div className="banner-sub">พารามิเตอร์ตู้สินค้าบางส่วนใน Amendment ไม่สอดรับกับใบหลัก B/L</div>
              </div>
            </div>

            <div className="result-card">
              <div className="result-card-header"><span className="bl-number">เอกสารฐานหลัก: OOCL62831109A</span></div>
              <table className="result-table">
                <thead>
                  <tr><th>Target Field</th><th>ข้อมูลเดิม B/L</th><th>ข้อมูลขอแก้ Amend</th><th>สถานะ</th><th>หมายเหตุการสืบค้น</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="field-name">Shipper Name</span></td>
                    <td>GLOBAL LOGISTICS CORP.</td>
                    <td>GLOBAL LOGISTICS CORP.</td>
                    <td><span className="badge-match">MATCH</span></td>
                    <td>ข้อมูลถูกต้องตรงกันตามเกณฑ์</td>
                  </tr>
                  <tr>
                    <td><span className="field-name">Seal Number</span></td>
                    <td>SL-9918231</td>
                    <td>SL-9918299</td>
                    <td><span className="badge-mismatch">MISMATCH</span></td>
                    <td>เลขซีลตู้สินค้าตัวท้ายไม่สอดคล้องกับพอร์ตใบเสร็จรับเงินต้นทาง</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        <Footer />
      </main>
    </div>
  );
}

// ─── Counter Service D/O Management Module (With Real-time Search) ─
function TrackingPage({ onBack }) {
  const [records, setRecords] = useState(loadRecords());
  const [bl, setBL] = useState("");
  const [consignee, setConsignee] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // State สำหรับคำค้นหา

  function handleSubmit() {
    if (!bl.trim()) return;
    const next = [...records, { bl: bl.trim().toUpperCase(), consignee: consignee.trim() || "N/A", date: getToday() }];
    setRecords(next); saveRecords(next);
    setBL(""); setConsignee("");
  }

  // ระบบค้นหาข้อมูล Real-time Filter (ค้นได้ทั้ง เลข BL และ ชื่อ Consignee)
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      if (!normalizedQuery) return true;
      return (
        r.bl.toLowerCase().includes(normalizedQuery) ||
        r.consignee.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [records, searchQuery]);

  return (
    <div>
      <Breadcrumb items={[{ label: "Dashboard", onClick: onBack }, { label: "D/O Counter Registry" }]} onBackAction={onBack} />
      <main className="main">
        <div className="page-header">
          <div className="page-icon"><Icons.Home /></div>
          <div>
            <div className="page-title-text">Delivery Order (D/O) Release Management</div>
            <div className="page-sub">Manage D/O release records and track document collection history with real-time search capabilities.</div>
          </div>
        </div>

        <div className="registry-control-panel">
          <div className="form-row">
            <div className="form-group">
              <label>หมายเลข Bill of Lading (B/L)</label>
              <input type="text" value={bl} placeholder="เช่น OOCL12345678" onChange={e => setBL(e.target.value)} />
            </div>
            <div className="form-group">
              <label>ชื่อบริษัทลูกค้า / Consignee</label>
              <input type="text" value={consignee} placeholder="บริษัท นำเข้า จำกัด" onChange={e => setConsignee(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSubmit}>บันทึกข้อมูลปล่อยเอกสาร</button>
        </div>

        <hr className="divider" />

        {/* 🔍 Search Input Subsystem section */}
        <div className="search-bar-container">
          <div className="search-title-box">
            <span className="search-badge-count">{filteredRecords.length}</span>
            <div className="search-label-text">ประวัติรายการปล่อยเอกสาร</div>
          </div>
          <div className="search-input-wrapper">
            <span className="search-icon"><Icons.Search /></span>
            <input 
              type="text" 
              className="search-input" 
              placeholder="พิมพ์ค้นหาด่วนด้วย หมายเลข B/L หรือ ชื่อ Consignee..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="btn-clear-search" onClick={() => setSearchQuery("")} title="ล้างคำค้นหา">
                <Icons.X />
              </button>
            )}
          </div>
        </div>

        <div className="table-card">
          <table>
            <thead>
              <tr><th>หมายเลขเอกสาร B/L</th><th>ชื่อบริษัทลูกค้า (Consignee)</th><th>วันที่ปล่อย D/O</th></tr>
            </thead>
            <tbody>
              {filteredRecords.length ? filteredRecords.map((r, i) => (
                <tr key={i}>
                  <td><strong style={{ fontFamily: "monospace", fontSize: 13, color: "var(--primary-navy)" }}>{r.bl}</strong></td>
                  <td>{r.consignee}</td>
                  <td><span className="date-badge">{r.date}</span></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", color: "var(--text-light)", padding: "48px 32px" }}>
                    {searchQuery ? "❌ ไม่พบข้อมูลที่สอดคล้องกับคำค้นหาของคุณ" : "ยังไม่มีประวัติการลงทะเบียนในระบบฐานข้อมูลชั่วคราวขณะนี้"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="danger-zone">
          <div className="danger-label">⚠ Administrator Database Flush Management</div>
          <button className="btn btn-danger" onClick={() => {
            if(confirm("คุณต้องการล้างข้อมูลบันทึกทั้งหมดออกใช่หรือไม่?")) { setRecords([]); saveRecords([]); setSearchQuery(""); }
          }}>
            ล้างข้อมูลใน Local Storage ทั้งหมด
          </button>
        </div>

        <Footer />
      </main>
    </div>
  );
}

// ─── Footer Component ─────────────────────────────────────────────
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-name">VERIFYHUB LOGISTICS CORE SYSTEMS</div>
      <div className="footer-meta">Operational Version 3.5 (Corporate Cream-Navy) · Platform of Freight Documentation Management</div>
    </footer>
  );
}

// ─── Main Switch Route Entrance ──────────────────────────────────
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