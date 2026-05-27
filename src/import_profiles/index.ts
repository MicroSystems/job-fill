import { importAllData } from "../storage";
import type { ExportData } from "../types";

const theme = localStorage.getItem("jf-theme") || "light";
document.documentElement.setAttribute("data-theme", theme);

const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const importBtn = document.getElementById("importBtn") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLDivElement;

importBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  importBtn.disabled = true;
  importBtn.textContent = "Importing...";
  statusEl.textContent = "";
  statusEl.className = "";

  try {
    const text = await file.text();
    const data: ExportData = JSON.parse(text);

    if (!data.profiles || typeof data.profiles !== "object") {
      throw new Error("Invalid file format: missing profiles data");
    }

    const profileCount = Object.keys(data.profiles).length;
    await importAllData(data);

    statusEl.textContent = `Imported ${profileCount} profile${profileCount === 1 ? "" : "s"} successfully! You can close this tab.`;
    statusEl.className = "success";
    importBtn.textContent = "Import Another";
    importBtn.disabled = false;
  } catch (err) {
    statusEl.textContent = "Import failed: " + (err instanceof Error ? err.message : String(err));
    statusEl.className = "error";
    importBtn.disabled = false;
    importBtn.textContent = "Try Again";
  }
});
