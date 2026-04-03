import { gmail } from "@googleapis/gmail";
import { OAuth2Client } from "google-auth-library";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmailHeader = { name: string; value: string };

type ParsedEmail = {
  subject: string;
  from: string;
  date: Date;
  companyName: string;
  position: string;
  body: string;
};

type GmailMessage = {
  payload: {
    headers: EmailHeader[];
    body: { data?: string };
    parts?: { mimeType: string; body: { data?: string } }[];
  };
};

// ─── Client ───────────────────────────────────────────────────────────────────

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

function getGmailClient(accessToken: string) {
  oauth2Client.setCredentials({ access_token: accessToken });
  return gmail({ version: "v1", auth: oauth2Client });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function capitalizeWords(str: string) {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getHeader(headers: EmailHeader[], name: string) {
  return headers.find((h) => h.name === name)?.value || "";
}

function decodeBase64(data: string) {
  return Buffer.from(data, "base64").toString("utf-8");
}

function extractBody(payload: GmailMessage["payload"]): string {
  if (payload.body.data) return decodeBase64(payload.body.data);
  const textPart = payload.parts?.find((p) => p.mimeType === "text/plain");
  if (textPart?.body.data) return decodeBase64(textPart.body.data);
  return "";
}

function parseEmailForApplication(message: GmailMessage): ParsedEmail | null {
  const { headers } = message.payload;
  const subject = getHeader(headers, "Subject");
  const from = getHeader(headers, "From");
  const date = getHeader(headers, "Date");

  const body = extractBody(message.payload);

  const emailMatch = from.match(/<(.+?)>/);
  const email = emailMatch ? emailMatch[1] : from;
  const domain = email.split("@")[1];
  const companyName = domain?.split(".")[0] || "Unknown Company";

  const positionMatch = subject.match(/for (?:the )?(.+?) (?:position|role)/i);
  const position = positionMatch ? positionMatch[1] : "Position";

  return {
    subject,
    from: email,
    date: new Date(date),
    companyName: capitalizeWords(companyName),
    position: capitalizeWords(position),
    body: body.substring(0, 500),
  };
}

// ─── Functions ────────────────────────────────────────────────────────────────

function getGmailAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/calendar.events",
    ],
  });
}

async function getGmailTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

async function searchApplicationEmails(accessToken: string) {
  const gmailClient = getGmailClient(accessToken);

  const query =
    "subject:(application received OR thank you for applying OR application confirmation)";

  const response = await gmailClient.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 10,
  });

  if (!response.data.messages) return [];

  const messages = await Promise.all(
    response.data.messages.map(async (message) => {
      const msg = await gmailClient.users.messages.get({
        userId: "me",
        id: message.id!,
        format: "full",
      });
      return parseEmailForApplication(msg.data as GmailMessage);
    }),
  );

  return messages.filter((m): m is ParsedEmail => m !== null);
}

export { getGmailAuthUrl, getGmailTokens, searchApplicationEmails };
