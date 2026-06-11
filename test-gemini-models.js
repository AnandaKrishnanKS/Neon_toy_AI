require("dotenv").config({ path: ".env" });

async function listModels() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("No API key found in .env");
    return;
  }
  
  // Note: the standard JS SDK might not have a built in list models function exposed easily, 
  // so I'll make a direct REST API call.
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Failed to list models. HTTP Status:", response.status, response.statusText);
      const text = await response.text();
      console.error("Error body:", text);
      return;
    }
    const data = await response.json();
    console.log("Models available for this API key:");
    data.models.forEach(m => console.log(` - ${m.name}`));
  } catch (e) {
    console.error("Error:", e.message);
  }
}

listModels();
