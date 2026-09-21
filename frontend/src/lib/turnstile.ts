interface TurnstileVerifyResult {
  success: boolean;
  error?: string;
}

export async function verifyTurnstileToken(
  token?: string | null,
  clientIp?: string
): Promise<TurnstileVerifyResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  // In development/testing environments where TURNSTILE_SECRET_KEY is omitted, pass gracefully
  if (!secretKey) {
    return { success: true };
  }

  if (!token) {
    return { success: false, error: "Turnstile verification token is missing." };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (clientIp) {
      formData.append("remoteip", clientIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = await res.json();
    if (!data.success) {
      return { success: false, error: "Turnstile bot verification challenge failed." };
    }

    // Hostname validation
    const allowedHostnamesStr = process.env.ALLOWED_TURNSTILE_HOSTNAMES || "localhost,127.0.0.1";
    const allowedHostnames = allowedHostnamesStr
      .split(",")
      .map((h) => h.trim().toLowerCase());
    const tokenHostname = (data.hostname || "").toLowerCase();

    if (tokenHostname && !allowedHostnames.includes(tokenHostname)) {
      return {
        success: false,
        error: `Turnstile hostname '${tokenHostname}' is not allowed.`,
      };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: `Turnstile service error: ${String(err)}`,
    };
  }
}
