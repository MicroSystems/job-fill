import { getConfig, getProfile } from "../storage";

async function callLLM(
  prompt: string,
): Promise<string> {
  const config = await getConfig();
  if (config.aiProvider === "none" || !config.aiApiKey) {
    throw new Error("AI provider not configured");
  }

  const system = `You are a job application assistant. Generate concise, professional answers 
to job application questions based on the user's profile. Keep answers under 200 words. 
Respond with only the answer text, no explanations.`;

  if (config.aiProvider === "openai") {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.aiApiKey}`,
      },
      body: JSON.stringify({
        model: config.aiModel || "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  }

  if (config.aiProvider === "anthropic") {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.aiApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.aiModel || "claude-3-haiku-20240307",
        system,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });
    const data = await resp.json();
    return data.content?.[0]?.text?.trim() ?? "";
  }

  if (config.aiProvider === "ollama") {
    const endpoint = config.aiEndpoint || "http://localhost:11434";
    const resp = await fetch(`${endpoint}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.aiModel || "llama3",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });
    const data = await resp.json();
    return data.message?.content?.trim() ?? "";
  }

  return "";
}

export async function generateAnswerForQuestion(
  questionText: string,
  fieldType: string,
): Promise<string | null> {
  const config = await getConfig();
  if (!config.aiAnswerCustomQuestions) return null;

  const profile = await getProfile();
  if (!profile) return null;

  const profileSummary = [
    `Name: ${profile.name.given} ${profile.name.family}`,
    `Email: ${profile.email}`,
    profile.skills.length ? `Skills: ${profile.skills.join(", ")}` : "",
    profile.experience
      .slice(0, 3)
      .map((e) => `- ${e.title} at ${e.company} (${e.start} - ${e.end ?? "present"})`)
      .join("\n"),
    profile.education
      .slice(0, 2)
      .map((e) => `- ${e.degree} in ${e.field} from ${e.school}`)
      .join("\n"),
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Job application question: "${questionText}"
Field type: ${fieldType}

Applicant profile:
${profileSummary}

Answer the question concisely based on this profile. If the profile lacks relevant info, 
give a reasonable professional answer. Respond with only the answer text.`;

  try {
    return await callLLM(prompt);
  } catch {
    return null;
  }
}
