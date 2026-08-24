import http from "node:http";

const MODEL = "qwen2.5-coder";
const OPTIONS = { host: "localhost", port: 11434, path: "/api/chat", method: "POST" };

interface Message {
  role: "user" | "assistant";
  content: string;
}

// node:http rather than fetch: undici caps headers at 300s, which would kill a
// long generation. keep_alive: -1 keeps the model resident between requests.
export class Ollama {
  #history: Message[] = [];

  async send(prompt: string): Promise<string> {
    this.#history.push({ role: "user", content: prompt });
    const body = { model: MODEL, messages: this.#history, stream: false, keep_alive: -1 };

    let reply: string;
    try {
      reply = await post(body);
    } catch (err) {
      this.#history.pop(); // drop the unanswered turn so a retry is not sent twice
      throw err;
    }

    this.#history.push({ role: "assistant", content: reply });
    return reply;
  }
}

function post(body: unknown): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = http.request(OPTIONS, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        try {
          const content = JSON.parse(Buffer.concat(chunks).toString()).message?.content;
          if (typeof content !== "string") throw new Error("no message content");
          resolve(content);
        } catch (err) {
          reject(new Error(`ollama sent an unreadable response: ${err}`));
        }
      });
    });
    request.on("error", (err) => reject(new Error(`ollama request failed: ${err.message}`)));
    request.end(JSON.stringify(body));
  });
}
