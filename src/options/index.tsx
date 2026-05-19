import React from "react";
import { createRoot } from "react-dom/client";
import type { ExtensionConfig } from "../types";
import { getConfig, saveConfig } from "../storage";
import "./App.css";

const ALL_PLATFORMS = ["workday", "greenhouse", "lever", "ashby", "smartrecruiters", "generic"] as const;

function OptionsApp() {
  const [config, setConfig] = React.useState<ExtensionConfig | null>(null);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    getConfig().then(setConfig);
  }, []);

  if (!config) return <div>Loading...</div>;

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

      <button className="btn btn-primary" onClick={handleSave}>
        {saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<OptionsApp />);
