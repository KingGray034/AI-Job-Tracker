import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getGmailTokens } from "@/server/services/gmail";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", request.url));
  }

  try {
    const tokens = await getGmailTokens(code);

    const cookieStore = await cookies();
    cookieStore.set("google_access_token", tokens.access_token ?? "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    });

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head><title>Authorization Success</title></head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, window.location.origin);
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