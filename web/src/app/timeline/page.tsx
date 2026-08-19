import { DocketForm } from "@/components/DocketForm";
import { EventDelete } from "@/components/EventDelete";
import { legalApiBase } from "@/lib/api/client";

type EventRow = {
  event_id: string;
  occurs_at: string;
  title: string;
  kind: string;
  detail: string;
  location: string;
  status: string;
  confirmed: boolean;
  source: string;
};

export default async function TimelinePage() {
  let events: EventRow[] = [];
  let error: string | null = null;
  try {
    const response = await fetch(`${legalApiBase()}/v1/docket-events`, { cache: "no-store" });
    if (!response.ok) throw new Error(`legal-api docket ${response.status}`);
    events = await response.json();
  } catch (exc) {
    error = exc instanceof Error ? exc.message : "legal-api unreachable";
  }

  const now = Date.now();
  const past = events.filter((item) => Date.parse(item.occurs_at) <= now);
  const upcoming = events.filter((item) => Date.parse(item.occurs_at) > now);

  return (
    <>
      <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a8476" }}>
        Timeline
      </p>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 500 }}>
        Vertical case timeline
      </h1>
      <p>
        Court events you enter. Not the Evidence Platform factual timeline.
        Empty until a real date is recorded.
      </p>
      {error ? <p>{error}</p> : null}
      <DocketForm />
      <div style={{ borderLeft: "2px solid #3a3f4b", paddingLeft: 20 }}>
        {past.map((item) => (
          <article key={item.event_id} style={{ marginBottom: 24, position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: -27,
                top: 6,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#8a8476",
              }}
            />
            <p style={{ color: "#8a8476", margin: 0 }}>
              {new Date(item.occurs_at).toLocaleString("en-US", { timeZone: "America/New_York" })}
            </p>
            <strong>
              [{item.kind}] {item.title}
            </strong>
            <p>
              {item.detail || item.location || item.status}
              <EventDelete eventId={item.event_id} />
            </p>
          </article>
        ))}
        <p
          style={{
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#c9a227",
            margin: "8px 0 24px",
          }}
        >
          Now
        </p>
        {upcoming.length === 0 ? <p>No upcoming court events recorded.</p> : null}
        {upcoming.map((item) => (
          <article key={item.event_id} style={{ marginBottom: 24, position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: -27,
                top: 6,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#c9a227",
              }}
            />
            <p style={{ color: "#8a8476", margin: 0 }}>
              {new Date(item.occurs_at).toLocaleString("en-US", { timeZone: "America/New_York" })}
            </p>
            <strong>
              [{item.kind}] {item.title}
            </strong>
            <p>
              {item.detail || item.location || item.status}
              {item.confirmed ? " · clerk-confirmed" : " · unconfirmed"}
              <EventDelete eventId={item.event_id} />
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
