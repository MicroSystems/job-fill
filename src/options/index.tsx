import React from "react";
import { createRoot } from "react-dom/client";
import type { ExtensionConfig, ExportData } from "../types";
import { getConfig, saveConfig, exportAllData, importAllData } from "../storage";
import "./App.css";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  return (localStorage.getItem("jf-theme") as Theme) || "light";
}

const ALL_PLATFORMS = ["workday", "greenhouse", "lever", "ashby", "smartrecruiters", "generic"] as const;

function OptionsApp() {
  const [config, setConfig] = React.useState<ExtensionConfig | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [importResult, setImportResult] = React.useState<string | null>(null);
  const [theme, setTheme] = React.useState<Theme>(getInitialTheme);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("jf-theme", theme);
  }, [theme]);

  React.useEffect(() => {
    getConfig().then(setConfig);
  }, []);

  if (!config) return <div>Loading...</div>;

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const togglePlatform = (p: string) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const enabled = prev.enabledPlatforms.includes(p as any)
        ? prev.enabledPlatforms.filter((x) => x !== p)
        : [...prev.enabledPlatforms, p as any];
      return { ...prev, enabledPlatforms: enabled };
    });
  };

  const update = (key: keyof ExtensionConfig, value: any) => {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleExport = async () => {
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
      console.error("export failed:", err);
      alert("Export failed. Check console for details.");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[import] change event, files:", e.target.files);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);
      const result = await importAllData(data);
      setImportResult(`Imported ${result.count} profile(s)`);
    } catch (err) {
      console.log("[import] error:", err);
      setImportResult("Import failed: " + String(err));
    } finally {
      setTimeout(() => setImportResult(null), 3000);
    }
    e.target.value = "";
  };

  const handleSave = async () => {
    if (config) {
      await saveConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="options-page">
      <header>
        <h1>Job Fill Settings</h1>
        <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === "light" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      </header>

      <section>
        <h2>Platforms</h2>
        <p className="hint">Enable/disable auto-fill for specific ATS platforms.</p>
        {ALL_PLATFORMS.map((p) => (
          <label key={p} className="checkbox-line">
            <input
              type="checkbox"
              checked={config.enabledPlatforms.includes(p)}
              onChange={() => togglePlatform(p)}
            />
            <span className="platform-name">{p.charAt(0).toUpperCase() + p.slice(1)}</span>
          </label>
        ))}
      </section>

      <section>
        <h2>Behavior</h2>
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={config.autoFillOnPageLoad}
            onChange={(e) => update("autoFillOnPageLoad", e.target.checked)}
          />
          Auto-fill when an application page loads
        </label>
      </section>

      <section>
        <h2>Auto-Apply</h2>
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={config.autoApplyEnabled}
            onChange={(e) => update("autoApplyEnabled", e.target.checked)}
          />
          Enable auto-apply (fill + submit)
        </label>
        {config.autoApplyEnabled && (
          <div className="field-group" style={{ marginTop: 8 }}>
            <label>
              Max multi-step pages
              <input
                type="number"
                min={1}
                max={30}
                value={config.autoApplyMaxSteps}
                onChange={(e) =>
                  update("autoApplyMaxSteps", parseInt(e.target.value, 10))
                }
              />
            </label>
          </div>
        )}
      </section>

      <section>
        <h2>AI Integration</h2>
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={config.aiAnswerCustomQuestions}
            onChange={(e) => update("aiAnswerCustomQuestions", e.target.checked)}
          />
          Use AI to answer custom questions
        </label>
        <p className="hint">
          Use an LLM to generate answers for custom application questions not covered by your profile.
        </p>
        <div className="field-group">
          <label>
            Provider
            <select
              value={config.aiProvider}
              onChange={(e) => update("aiProvider", e.target.value)}
            >
              <option value="none">None (off)</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="ollama">Ollama (local)</option>
            </select>
          </label>
          {config.aiProvider !== "none" && (
            <>
              {config.aiProvider !== "ollama" && (
                <label>
                  API Key
                  <input
                    type="password"
                    value={config.aiApiKey}
                    onChange={(e) => update("aiApiKey", e.target.value)}
                  />
                </label>
              )}
              {config.aiProvider === "openai" && (
                <label>
                  Model
                  <input
                    value={config.aiModel || "gpt-4o-mini"}
                    onChange={(e) => update("aiModel", e.target.value)}
                  />
                </label>
              )}
              {config.aiProvider === "anthropic" && (
                <label>
                  Model
                  <input
                    value={config.aiModel || "claude-3-haiku-20240307"}
                    onChange={(e) => update("aiModel", e.target.value)}
                  />
                </label>
              )}
              {config.aiProvider === "ollama" && (
                <label>
                  Endpoint (e.g. http://localhost:11434)
                  <input
                    value={config.aiEndpoint || "http://localhost:11434"}
                    onChange={(e) => update("aiEndpoint", e.target.value)}
                  />
                </label>
              )}
            </>
          )}
        </div>
      </section>

      <section>
        <h2>Data Management</h2>
        <p className="hint">
          Export profiles to a JSON file for backup, or import from a previously exported file.
        </p>
        <div className="data-actions">
          <button className="btn btn-secondary" onClick={handleExport}>
            Export Profiles
          </button>
          <label className="btn btn-secondary" htmlFor="options-import-input">
            Import Profiles
          </label>
          <input id="options-import-input" type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
        </div>
        {importResult !== null && (
          <p className="import-status">{importResult}</p>
        )}
        <label className="checkbox-line" style={{ marginTop: 12 }}>
          <input
            type="checkbox"
            checked={config.autoSave}
            onChange={(e) => update("autoSave", e.target.checked)}
          />
          Auto-save profiles to Downloads (<code>job-fill-profiles.json</code>)
        </label>
      </section>

      <button className="btn btn-primary" onClick={handleSave}>
        {saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<OptionsApp />);
