import { ReviewForm } from "@/components/ReviewForm";
import { legalApiBase } from "@/lib/api/client";

export default async function ReviewPage() {
  let reviews: Array<{
    review_id: string;
    section_id: string;
    verdict: string;
    rationale: string;
    reviewer: string;
    content_hash: string;
  }> = [];
  let drafts: Array<{ section_id: string; heading: string }> = [];
  let error: string | null = null;
  try {
    const [reviewResponse, draftResponse] = await Promise.all([
      fetch(`${legalApiBase()}/v1/reviews`, { cache: "no-store" }),
      fetch(`${legalApiBase()}/v1/drafts`, { cache: "no-store" }),
    ]);
    if (!reviewResponse.ok) throw new Error(`legal-api reviews ${reviewResponse.status}`);
    if (!draftResponse.ok) throw new Error(`legal-api drafts ${draftResponse.status}`);
    reviews = await reviewResponse.json();
    drafts = await draftResponse.json();
  } catch (exc) {
    error = exc instanceof Error ? exc.message : "legal-api unreachable";
  }

  return (
    <>
      <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a8476" }}>
        Owner review
      </p>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 500 }}>
        Human verdict before any release
      </h1>
      <p>
        Agents cannot approve. An approve is bound to the section hash. Edit the
        draft and the prior approval no longer counts.
      </p>
      {error ? <p>{error}</p> : null}
      <ReviewForm sections={drafts} />
      {reviews.length === 0 && !error ? <p>No review decisions yet.</p> : null}
      {reviews.map((review) => (
        <article
          key={review.review_id}
          style={{ borderTop: "1px solid #2a2e38", padding: "16px 0" }}
        >
          <strong>
            [{review.verdict}] {review.reviewer}
          </strong>
          <p>{review.rationale}</p>
          <p style={{ color: "#8a8476" }}>{review.content_hash}</p>
        </article>
      ))}
    </>
  );
}
