import { storeResume } from "../storage";

const theme = localStorage.getItem("jf-theme") || "light";
document.documentElement.setAttribute("data-theme", theme);

const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const uploadBtn = document.getElementById("uploadBtn") as HTMLButtonElement;
const statusEl = document.getElementById("status") as HTMLDivElement;

uploadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  if (file.type !== "application/pdf") {
    statusEl.textContent = "Only PDF files are accepted.";
    statusEl.className = "error";
    return;
  }

  uploadBtn.disabled = true;
  uploadBtn.textContent = "Uploading...";
  statusEl.textContent = "";
  statusEl.className = "";

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

    const base64 = dataUrl.split(",")[1];
    await storeResume(file.name, base64);

    statusEl.textContent = "Resume uploaded! You can close this tab.";
    statusEl.className = "success";
    uploadBtn.textContent = "Upload Another";
    uploadBtn.disabled = false;
  } catch (err) {
    statusEl.textContent = "Upload failed: " + (err instanceof Error ? err.message : String(err));
    statusEl.className = "error";
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Try Again";
  }
});
