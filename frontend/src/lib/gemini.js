// Tata's chat brain: Google Gemini (AI Studio), called through the Vite dev-server proxy at /gemini,
// which adds the API key (GEMINI_API_KEY in .env.local). The key never reaches the browser.
// gemini-2.5-* is closed to new keys; 3.5 Flash with low thinking answered farm questions correctly in ~5 s
const MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash'
const URL = `/gemini/v1beta/models/${MODEL}:generateContent`
const TIMEOUT_MS = 60e3 // replies usually take 5–30 s

/**
 * history: [{ role: 'user' | 'assistant', content }], system: instructions + farm context.
 * Resolves to Tata's reply text; throws Error with .status on failure.
 */
export async function geminiChat(history, system) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctl.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: history.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: 2048, thinkingConfig: { thinkingLevel: 'low' } },
      }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      const err = new Error(data?.error?.message || `Gemini request failed (${res.status})`)
      err.status = res.status === 429 ? 503 : res.status
      throw err
    }
    const text = data?.candidates?.[0]?.content?.parts?.filter((p) => !p.thought).map((p) => p.text || '').join('').trim()
    if (!text) {
      const err = new Error(data?.promptFeedback?.blockReason ? 'Tata can’t answer that one.' : 'Empty reply')
      err.status = 502
      throw err
    }
    return text
  } catch (e) {
    if (e.name === 'AbortError') {
      const err = new Error('timeout')
      err.status = 504
      throw err
    }
    throw e
  } finally {
    clearTimeout(t)
  }
}
