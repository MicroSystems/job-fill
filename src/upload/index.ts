const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const statusEl = document.getElementById("status") as HTMLDivElement;
const doneEl = document.getElementById("done") as HTMLDivElement;

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  statusEl.textContent = "Reading file...";

  const reader = new FileReader();
  reader.onload = async () => {
    const data = (reader.result as string).split(",")[1];
    await browser.storage.local.set({
      jobfill_resume: { filename: file.name, data },
    });
    statusEl.textContent = "";
    doneEl.style.display = "block";
  };
  reader.readAsDataURL(file);
});
