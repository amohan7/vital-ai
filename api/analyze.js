const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

const DEFAULT_API_KEY = process.env.GEMINI_API_KEY || "";

const SAFETY_MAP = {
  BLOCK_NONE:             HarmBlockThreshold.BLOCK_NONE,
  BLOCK_ONLY_HIGH:        HarmBlockThreshold.BLOCK_ONLY_HIGH,
  BLOCK_MEDIUM_AND_ABOVE: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  BLOCK_LOW_AND_ABOVE:    HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
};

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Accept GET (iOS Shortcut query params) or POST (dashboard JSON)
  let data;
  if (req.method === "GET") {
    data = req.query;
  } else if (req.method === "POST") {
    data = req.body;
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!data) return res.status(400).json({ error: "No data provided" });

  // Read Gemini config from request, fall back to env
  const cfg         = data._gemini || {};
  const apiKey      = cfg.api_key || DEFAULT_API_KEY;
  const modelName   = cfg.model || "gemini-2.5-flash";
  const maxTokens   = parseInt(cfg.max_tokens) || 2048;
  const temperature = parseFloat(cfg.temperature) ?? 0.7;
  const topP        = parseFloat(cfg.top_p) ?? 0.95;
  const safetyKey   = cfg.safety || "BLOCK_MEDIUM_AND_ABOVE";

  if (!apiKey) {
    return res.status(400).json({
      error: "No Gemini API key configured. Add it in the dashboard settings or set GEMINI_API_KEY in your Vercel environment variables."
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const safetySettings = [
      HarmCategory.HARM_CATEGORY_HARASSMENT,
      HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    ].map(category => ({ category, threshold: SAFETY_MAP[safetyKey] }));

    const model = genAI.getGenerativeModel({ model: modelName, safetySettings });
    const prompt = data._custom_prompt || buildDefaultPrompt(data);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature, topP },
    });

    const response = await result.response;
    return res.status(200).json({ analysis: response.text(), status: "success" });

  } catch (err) {
    console.error("Gemini error:", err);
    return res.status(500).json({ error: err.message || "Gemini request failed" });
  }
};

function buildDefaultPrompt(data) {
  // Handle both 7-day array (from dashboard) and single-day flat object (from Shortcut)
  const days = data.days || [data];
  const lines = [
    "You are a helpful health analyst. Analyze this anonymous health data and provide clear, actionable insights.\n"
  ];
  days.forEach((d, i) => {
    const label = days.length === 1 ? "Today" : `Day ${i + 1}`;
    lines.push(`${label}:`);
    lines.push(`  Steps: ${d.steps ?? "N/A"} | Active calories: ${d.active_calories ?? "N/A"} kcal | VO2 Max: ${d.vo2_max ?? "N/A"}`);
    lines.push(`  HR: ${d.resting_hr ?? "N/A"} resting / ${d.avg_hr ?? "N/A"} avg bpm | HRV: ${d.hrv ?? "N/A"} ms`);
    lines.push(`  SpO2: ${d.blood_oxygen ?? "N/A"}% | Resp rate: ${d.respiratory_rate ?? "N/A"} br/min`);
    lines.push(`  Workout: ${d.workout_type ?? "N/A"} ${d.workout_duration ? d.workout_duration + "min" : ""} ${d.workout_calories ? d.workout_calories + "kcal" : ""}`);
    lines.push(`  Sleep: ${d.sleep_hours ?? "N/A"} hrs\n`);
  });
  if (days.length > 1) {
    lines.push("Provide:");
    lines.push("1) Weekly summary — overall patterns and notable changes");
    lines.push("2) Cardio fitness trend — VO2 max and workout consistency");
    lines.push("3) Heart health — resting HR and HRV trends");
    lines.push("4) Respiratory health — SpO2 and breathing rate");
    lines.push("5) Recovery quality — sleep and HRV correlation");
    lines.push("6) Best and worst days this week and why");
    lines.push("7) Two specific actionable recommendations for next week");
  } else {
    lines.push("Provide:");
    lines.push("1) A brief overall summary");
    lines.push("2) What looks good today");
    lines.push("3) Any areas of concern");
    lines.push("4) One specific actionable tip for tomorrow");
  }
  return lines.join("\n");
}
