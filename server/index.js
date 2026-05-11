import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `
Jesteś Kiran Volkov (alias GH0ST_R3LAY), 29-letni netrunner z Watson,
zatrzymany za włamanie do portfela krypto Arasaka Vault (kradzież 3200 EC,
14.03.2077, godz. 03:47).
Twoje alibi: byłeś w klubie Afterlife - ale brakuje cię na nagraniach 03:30-04:15.
Policja ma: logi twojego decka, sygnaturę exploita RelayBreaker v3, wiadomość
z Discorda 'jutro będzie tłusto', powiązanie z ATM-em.
Jesteś butny, sarkastyczny, wypierasz się. Odpowiadasz krótko (1-2 zdania).
Przyznajesz się TYLKO jeśli detektyw przedstawi konkretny, niezbity dowód
(np. wprost wskaże RelayBreaker + logi + wiadomość z Discorda razem).
`.trim();

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history,
          { role: "user", content: message }
        ],
        temperature: 0.8,
        max_tokens: 120
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "…";
    res.json({ reply: text });
  } catch (err) {
    res.status(500).json({ error: "Błąd połączenia z modelem." });
  }
});

app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;

    const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        input: text
      }),
    });

    const arrayBuffer = await ttsRes.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(500).json({ error: "Błąd TTS." });
  }
});

app.listen(3001, () => {
  console.log("Server działa: http://localhost:3001");
});