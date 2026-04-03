import { calendar } from "@googleapis/calendar";
import { OAuth2Client } from "google-auth-library";

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

/**
 * Create calendar event for interview
 */
async function createInterviewEvent(
  accessToken: string,
  interview: {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    location?: string;
  },
) {
  oauth2Client.setCredentials({ access_token: accessToken });
  const cal = calendar({ version: "v3", auth: oauth2Client });
  const event = {
    summary: interview.title,
    description: interview.description,
    location: interview.location,
    start: {
      dateTime: interview.startTime.toISOString(),
      timeZone: "Africa/Lagos",
    },
    end: {
      dateTime: interview.endTime.toISOString(),
      timeZone: "Africa/Lagos",
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 30 },
      ],
    },
  };
  const response = await cal.events.insert({
    calendarId: "primary",
    requestBody: event,
  });
  return response.data;
}

/**
 * Get upcoming interview events
 */
async function getUpcomingInterviews(accessToken: string) {
  oauth2Client.setCredentials({ access_token: accessToken });
  const cal = calendar({ version: "v3", auth: oauth2Client });
  const response = await cal.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime",
    q: "interview",
  });
  return response.data.items || [];
}

export { createInterviewEvent, getUpcomingInterviews };
