const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env" });

async function test() {
  console.log("Testing with API Key:", process.env.GEMINI_API_KEY ? "Set" : "Not Set");
  if (!process.env.GEMINI_API_KEY) {
    console.error("No API key found in .env");
    return;
  }
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Say hello!");
    console.log("Response:", result.response.text());
  } catch (e) {
    console.error("gemini-2.5-flash failed:", e.message);
  }
}

test();
