import { createServer } from "node:http";

/**
 * A stand-in for Brevo's send-email API, so the database tests can check emails without sending any.
 * The test server points BREVO_API_URL here (tests/db/env.ts). It keeps what it receives in memory:
 *   POST /v3/smtp/email   accepts an email like Brevo does
 *   GET  /emails?to=<address>   lists the emails sent to that address
 * Started by playwright.db.config.ts.
 */

type Sent = { to: string; subject: string; text: string; html: string; tags: string[] };

const port = Number(process.argv[2] ?? 3299);
const sent: Sent[] = [];

createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`);
  if (request.method === "POST" && url.pathname === "/v3/smtp/email") {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      const email = JSON.parse(body);
      sent.push({
        to: email.to?.[0]?.email ?? "",
        subject: email.subject ?? "",
        text: email.textContent ?? "",
        html: email.htmlContent ?? "",
        tags: email.tags ?? [],
      });
      response.writeHead(201, { "content-type": "application/json" });
      response.end(JSON.stringify({ messageId: `<fake-${sent.length}@brevo.test>` }));
    });
    return;
  }
  if (request.method === "GET" && url.pathname === "/emails") {
    const to = url.searchParams.get("to");
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(sent.filter((email) => !to || email.to === to)));
    return;
  }
  response.writeHead(url.pathname === "/" ? 200 : 404);
  response.end();
}).listen(port);
