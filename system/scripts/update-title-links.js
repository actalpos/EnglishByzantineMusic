import fs from "fs";

const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwwluuAhbA9VPIkn24nqhaYqvYjXArT8W-HUKO4e0U-RHsBOCUGyLosGuh88Pxapxyvig/exec";
const LOCAL_PATH = "./data/titleLink.json";

async function update() {
  console.log("🔄 Generating JSON from Drive...");

  const res = await fetch(`${WEBAPP_URL}?action=generate`);
  const data = await res.json();

  if (!data.fileId || !data.content) {
    throw new Error("Invalid response from Apps Script");
  }

  // Save locally
  fs.writeFileSync(LOCAL_PATH, data.content, "utf-8");
  console.log("✅ Saved locally:", LOCAL_PATH);

  // Delete remote
  console.log("🗑 Deleting temporary file from Drive...");
  await fetch(`${WEBAPP_URL}?action=delete&fileId=${data.fileId}`);

  console.log("✅ Deleted from Drive.");
}

update().catch(console.error);
