const chrome = typeof browser !== "undefined" ? browser : chrome;
const API_URL = "http://localhost:3000/api/trpc";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function showStatus(message, type) {
  const el = document.getElementById("statusMsg");
  el.textContent = message;
  el.className = `status ${type}`;
}

function fillForm(job) {
  document.getElementById("position").value = job.position || "";
  document.getElementById("company").value = job.company || "";
  document.getElementById("location").value = job.location || "";
  document.getElementById("url").value = job.url || "";
  document.getElementById("description").value = job.description || "";
}

function getFormData() {
  return {
    position: document.getElementById("position").value,
    companyName: document.getElementById("company").value,
    companyWebsite: "",
    location: document.getElementById("location").value || undefined,
    salary: document.getElementById("salary").value || undefined,
    contactEmail: document.getElementById("contactEmail").value || undefined,
    status: document.getElementById("status").value, // ✅ FIXED - was "statusMsg"
    jobUrl: document.getElementById("url").value || undefined,
    jobDescription: document.getElementById("description").value || undefined,
  };
}

// ─── Autofill Button ─────────────────────────────────────────────────────────

document.getElementById("autofillBtn").addEventListener("click", () => {
  const btn = document.getElementById("autofillBtn");
  btn.disabled = true;
  btn.textContent = "Extracting...";

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: "extractJob" },
      (response) => {
        btn.disabled = false;
        btn.textContent = "Autofill";

        if (response?.jobData) {
          fillForm(response.jobData);
          showStatus("Autofilled from page!", "success");
        } else {
          showStatus(
            "Could not extract from this page. Fill manually.",
            "error",
          );
        }
      },
    );
  });
});

// ─── Save Button ─────────────────────────────────────────────────────────────

document.getElementById("saveBtn").addEventListener("click", async () => {
  const btn = document.getElementById("saveBtn");
  btn.disabled = true;
  btn.textContent = "Saving...";

  try {
    const response = await fetch(`${API_URL}/application.create?batch=1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 0: { json: getFormData() } }),
    });

    const responseData = await response.json();

    if (response.ok) {
      showStatus("Job added to tracker!", "success");
      setTimeout(() => window.close(), 2000);
    } else {
      console.error("API error:", responseData);
      throw new Error("Failed to save");
    }
  } catch (error) {
    console.error("Save failed:", error);
    showStatus("Error saving. Make sure your tracker app is running!", "error");
    btn.disabled = false;
    btn.textContent = "Save to Tracker";
  }
});
