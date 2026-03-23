const ESSENTIAL_EVENTS = new Set([
  "page_view", "login", "logout", "signup_completed", "class_enrolled",
]);

export function trackEvent(eventType: string, eventData?: Record<string, any>) {
  try {
    // Check consent — allow essential events even without explicit consent
    const raw = localStorage.getItem("etude_cookie_consent");
    if (raw) {
      const consent = JSON.parse(raw);
      if (!consent?.consent?.analytics && !ESSENTIAL_EVENTS.has(eventType)) {
        return;
      }
    }

    let sessionId = sessionStorage.getItem("etude_session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem("etude_session_id", sessionId);
    }

    fetch("/api/analytics/event", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        event_data: eventData,
        page: window.location.pathname,
        session_id: sessionId,
      }),
    }).catch(() => {});
  } catch {
    // never crash the app
  }
}
