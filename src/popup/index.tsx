import React from "react";
import { createRoot } from "react-dom/client";
import { ProfileForm } from "./ProfileForm";
import "./App.css";

function App() {
  const [tab, setTab] = React.useState<"profile" | "action" | "history">("profile");

  return (
    <div className="popup">
      <header className="popup-header">
        <h1>Job Fill</h1>
        <nav className="tab-bar">
          <button
            className={`tab ${tab === "profile" ? "active" : ""}`}
            onClick={() => setTab("profile")}
          >
            Profile
          </button>
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
        {tab === "profile" && <ProfileForm />}
        {tab === "action" && <ActionPanel />}
        {tab === "history" && <HistoryPanel />}
      </div>
    </div>
  );
}

function ActionPanel() {
  const [platform, setPlatform] = React.useState<string>("");
  const [status, setStatus] = React.useState<string>("");
  const [result, setResult] = React.useState<string>("");

  React.useEffect(() => {
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        const tab = tabs[0];
        if (tab.id) {
          return browser.tabs.sendMessage(tab.id, { type: "get-platform" });
        }
      })
      .then((res: any) => {
        if (res?.platform) setPlatform(res.platform);
      })
      .catch(() => setPlatform("unknown"));
  }, []);

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
      try { browser.runtime.onMessage.removeListener(handler); } catch {}
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
      <div className="platform-badge">
        Detected: <strong>{platform || "scanning..."}</strong>
      </div>

      <button className="btn btn-secondary" onClick={() => handleAction("autofill")}>
        Auto-Fill This Page
      </button>

      <button className="btn btn-primary" onClick={() => handleAction("autoapply")}>
        Auto-Apply This Page
      </button>

      <p className="hint">
        Auto-Fill fills the form for review. Auto-Apply fills and submits.
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
