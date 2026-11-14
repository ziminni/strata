const http = require("node:http");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

const port = Number(process.env.PORT) || 3000;
const indexPath = path.join(__dirname, "index.html");
const maxRequestBytes = 1_000_000;
const geminiTimeoutMs = 60_000;

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    try {
      const html = await readFile(indexPath);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    } catch (error) {
      console.error("Could not read the chat page:", error);
      res.writeHead(500).end("Unable to load the chat page.");
    }
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/chat") {
    res.writeHead(404).end("Not found.");
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Set GEMINI_API_KEY before starting the server." }));
    return;
  }

  try {
    const chunks = [];
    let requestBytes = 0;
    for await (const chunk of req) {
      requestBytes += chunk.length;
      if (requestBytes > maxRequestBytes) {
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Request is too large." }));
        return;
      }
      chunks.push(chunk);
    }

    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (
      !Array.isArray(body.messages) ||
      body.messages.length === 0 ||
      body.messages.length > 40 ||
      body.messages.some(
        (message) =>
          !message ||
          !["user", "assistant"].includes(message.role) ||
          typeof message.content !== "string" ||
          message.content.length > 4000,
      )
    ) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Please send a valid chat conversation." }));
      return;
    }

    const apiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": process.env.GEMINI_API_KEY,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(geminiTimeoutMs),
        body: JSON.stringify({
          contents: body.messages.map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.content }],
          })),
        }),
      },
    );

    const result = await apiResponse.json();
    if (!apiResponse.ok) {
      const message = result.error?.message || `Gemini API error (${apiResponse.status}).`;
      res.writeHead(apiResponse.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: message }));
      return;
    }

    const reply = result.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter((text) => typeof text === "string")
      .join("");
    if (typeof reply !== "string") {
      throw new Error("Gemini returned an unexpected response.");
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ reply }));
  } catch (error) {
    console.error("Chat request failed:", error);
    if (!res.headersSent) {
      const isInvalidJson = error instanceof SyntaxError;
      const isTimeout = error instanceof Error && error.name === "TimeoutError";
      res.writeHead(isInvalidJson ? 400 : isTimeout ? 504 : 502, {
        "Content-Type": "application/json",
      });
      res.end(
        JSON.stringify({
          error: isInvalidJson
            ? "Request body must be valid JSON."
            : isTimeout
              ? "Gemini took too long to respond. Please try again."
              : "Unable to get a reply from Gemini.",
        }),
      );
    }
  }
});

server.listen(port, () => {
  console.log(`Gemini chatbot running at http://localhost:${port}`);
});
