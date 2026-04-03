import { NextRequest, NextResponse } from "next/server";
import { getGmailTokens } from "@/server/services/gmail";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  try {
    const tokens = await getGmailTokens(code);

    // JSON.stringify prevents XSS from token values containing special characters
    const tokenJson = JSON.stringify(tokens.access_token);

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head><title>Authorization Success</title></head>
        <body>
          <script>
            if (window.opener) {
              const token = ${tokenJson};
              window.opener.localStorage.setItem('gmail_access_token', token);
              window.opener.localStorage.setItem('google_access_token', token);
              window.close();
            } else {
              document.body.innerHTML = '<p>Authorization successful! You can close this window.</p>';
            }
          </script>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } },
    );
  } catch (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
  }
}
