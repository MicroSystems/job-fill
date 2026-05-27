import React from "react";
import { createRoot } from "react-dom/client";
import { exportAllData } from "../storage";
import "./App.css";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  return (localStorage.getItem("jf-theme") as Theme) || "light";
}

function App() {
  const [tab, setTab] = React.useState<"action" | "history">("action");
  const [theme, setTheme] = React.useState<Theme>(getInitialTheme);
  const [profileNames, setProfileNames] = React.useState<string[]>([]);
  const [currentProfile, setCurrentProfile] = React.useState("");
  const [platform, setPlatform] = React.useState<string>("");
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [addName, setAddName] = React.useState("");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const menuBtnRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("jf-theme", theme);
  }, [theme]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node) && !menuBtnRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const loadProfiles = async () => {
    try {
      const resp = await browser.runtime.sendMessage({ type: "get-profile-names" });
      console.log("loadProfiles response:", resp);
      if (resp) {
        setProfileNames(resp.names ?? []);
        setCurrentProfile(resp.current ?? "");
      } else {
        console.warn("loadProfiles: no response from background");
      }
    } catch (err) {
      console.error("loadProfiles error:", err);
    }
  };

  React.useEffect(() => { loadProfiles(); }, []);

  React.useEffect(() => {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const tab = tabs[0];
      if (tab.id) {
        browser.tabs.sendMessage(tab.id, { type: "get-platform" }).then((res: any) => {
          if (res?.platform) setPlatform(res.platform);
        }).catch(() => {});
      }
    });
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const handleProfileChange = async (name: string) => {
    await browser.runtime.sendMessage({ type: "set-current-profile", name });
    setCurrentProfile(name);
  };

  const handleAddProfile = () => {
    setMenuOpen(false);
    setAddName("");
    setShowAddModal(true);
  };

  const confirmAdd = async () => {
    const name = addName.trim();
    if (!name) return;
    await browser.runtime.sendMessage({ type: "create-profile", name });
    setShowAddModal(false);
    await loadProfiles();
  };

  const cancelAdd = () => setShowAddModal(false);

  const handleDeleteProfile = async () => {
    setMenuOpen(false);
    if (profileNames.length <= 1) {
      alert("Cannot delete the last profile.");
      return;
    }
    setDeleteTarget(currentProfile);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await browser.runtime.sendMessage({ type: "delete-profile", name: deleteTarget });
    setDeleteTarget(null);
    await loadProfiles();
  };

  const cancelDelete = () => setDeleteTarget(null);

  const handleExport = async () => {
    setMenuOpen(false);
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const url = "data:application/json;charset=utf-8," + encodeURIComponent(json);
      const a = document.createElement("a");
      a.href = url;
      a.download = `job-fill-profiles-${new Date().toISOString().slice(0, 10)}.json`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleImport = () => {
    setMenuOpen(false);
    browser.tabs.create({ url: "import_profiles.html" });
  };

  const handleEdit = () => {
    setMenuOpen(false);
    browser.runtime.sendMessage({ type: "open-profile" });
  };

  return (
    <div className="popup">
      <header className="popup-header">
        <div className="header-row">
          <span></span>
          <h1>Job Fill</h1>
          <div className="header-actions">
            <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
              {theme === "light" ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
            <div className="menu-wrapper">
              <button className="icon-btn" ref={menuBtnRef} onClick={() => setMenuOpen(!menuOpen)} title="More">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
              {menuOpen && (
                <div className="menu-dropdown" ref={menuRef}>
                  <button className="menu-item" onClick={handleAddProfile}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Profile
                  </button>
                  <button className={`menu-item${profileNames.length === 0 ? " menu-item-disabled" : ""}`} onClick={profileNames.length > 0 ? handleEdit : undefined}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit Profile
                  </button>
                  <button className={`menu-item menu-item-danger${profileNames.length === 0 ? " menu-item-disabled" : ""}`} onClick={profileNames.length > 0 ? handleDeleteProfile : undefined}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Delete Profile
                  </button>
                  <div className="menu-divider" />
                  <button className="menu-item" onClick={handleExport}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Export
                  </button>
                  <button className="menu-item" onClick={handleImport}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Import
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="detected-row">
          Detected: <strong>{platform || "scanning..."}</strong>
        </div>

        <div className="profile-selector-row">
          <label className="profile-label">Profile:</label>
          <select
            className="profile-select"
            value={currentProfile}
            disabled={profileNames.length === 0}
            onChange={(e) => handleProfileChange(e.target.value)}
          >
            {profileNames.length === 0 && <option value="">No profiles</option>}
            {profileNames.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <nav className="tab-bar">
          <button
            className={`tab ${tab === "action" ? "active" : ""}`}
            onClick={() => setTab("action")}
          >
            Auto-Fill
          </button>
          <button
            className={`tab ${tab === "history" ? "active" : ""}`}
            onClick={() => setTab("history")}
          >
            History
          </button>
        </nav>
      </header>

      <div className="popup-body">
        {tab === "action" && <ActionPanel />}
        {tab === "history" && <HistoryPanel />}
      </div>

      {deleteTarget && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p>Delete profile <strong>{deleteTarget}</strong>?</p>
            <p className="modal-hint">This will also remove the saved resume for this profile.</p>
            <div className="modal-actions">
              <button className="btn btn-small" onClick={cancelDelete}>Cancel</button>
              <button className="btn btn-small modal-confirm" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={cancelAdd}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p>Add Profile</p>
            <p className="modal-hint">Enter a name for the new profile.</p>
            <form onSubmit={(e) => { e.preventDefault(); confirmAdd(); }}>
              <input
                className="modal-input"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Profile name"
                autoFocus
              />
              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn btn-small" onClick={cancelAdd}>Cancel</button>
                <button type="submit" className="btn btn-small modal-confirm" style={{ background: "#D97757", color: "#fff", borderColor: "#D97757" }}>Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionPanel() {
  const [status, setStatus] = React.useState<string>("");
  const [result, setResult] = React.useState<string>("");

  React.useEffect(() => {
    const handler = (msg: any) => {
      if (msg.type === "autofill-result") {
        setStatus("Done");
        setResult(JSON.stringify(msg.result, null, 2));
      }
      if (msg.type === "autoapply-result") {
        const lines: string[] = [];
        lines.push(`Platform: ${msg.platform}`);
        lines.push(`Filled: ${msg.result.fill.filled} fields`);
        if (msg.result.submit) {
          lines.push(`Submit: ${msg.result.submit.submitted ? "Success" : "Failed"}`);
          lines.push(`Steps: ${msg.result.submit.steps}`);
          if (msg.result.submit.errors.length) {
            lines.push(`Errors: ${msg.result.submit.errors.join(", ")}`);
          }
        }
        setStatus(msg.success ? "Submitted!" : "Failed");
        setResult(lines.join("\n"));
      }
    };
    browser.runtime.onMessage.addListener(handler);
    return () => {
      try {
        browser.runtime.onMessage.removeListener(handler);
      } catch {}
    };
  }, []);

  const handleAction = async (action: "autofill" | "autoapply") => {
    setStatus(action === "autoapply" ? "Applying..." : "Filling...");
    setResult("");
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (tab.id) {
        await browser.tabs.sendMessage(tab.id, { type: action });
      }
    } catch {
      setStatus("Error: no application form detected");
    }
  };

  return (
    <div className="action-panel">
      <button className="btn btn-secondary" onClick={() => handleAction("autofill")}>
        Auto-Fill This Page
      </button>

      <p className="hint">
        Auto-Fill fills the form for review.
      </p>

      {status && (
        <div className="status-box">
          <strong>{status}</strong>
          {result && <pre className="result">{result}</pre>}
        </div>
      )}
    </div>
  );
}

function HistoryPanel() {
  const [jobs, setJobs] = React.useState<any[]>([]);

  React.useEffect(() => {
    const worker = async () => {
      const resp = await browser.runtime.sendMessage({ type: "get-applied-jobs" });
      if (resp?.jobs) setJobs(resp.jobs);
    };
    worker();
  }, []);

  const handleClear = async () => {
    await browser.runtime.sendMessage({ type: "clear-applied-jobs" });
    setJobs([]);
  };

  if (jobs.length === 0) {
    return (
      <div className="history-panel">
        <p className="empty-state">No jobs applied yet.</p>
      </div>
    );
  }

  return (
    <div className="history-panel">
      <div className="history-header">
        <span>{jobs.length} job{jobs.length !== 1 ? "s" : ""}</span>
        <button className="btn btn-small" onClick={handleClear}>
          Clear
        </button>
      </div>
      <ul className="job-list">
        {jobs.map((job, i) => (
          <li key={i} className="job-item">
            <div className="job-url" title={job.url}>
              {new URL(job.url).pathname}
            </div>
            <div className="job-meta">
              <span className={`badge ${job.success ? "success" : "fail"}`}>
                {job.success ? "Applied" : "Failed"}
              </span>
              <span className="platform-tag">{job.platform}</span>
              <span className="timestamp">
                {new Date(job.timestamp).toLocaleDateString()}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
