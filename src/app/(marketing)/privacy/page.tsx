import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Privacy</p>
      <h1 className="mt-3 text-4xl font-semibold text-zinc-50">CoverGrail Privacy Notice</h1>
      <div className="mt-8 space-y-6 text-sm leading-7 text-zinc-300">
        <p>
          CoverGrail processes the account information and comic-book content needed to provide
          pre-submission grading estimates, save your scan history, and operate the beta.
        </p>
        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Information we process</h2>
          <p className="mt-2">
            This may include your email address, comic photos, comic details and notes, grading
            estimates, confirmed grades you enter, plan/usage information, feedback, and limited
            product-event data such as scan started or grading completed.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-zinc-100">How it is used</h2>
          <p className="mt-2">
            We use this information to authenticate you, store your collection, generate grading
            estimates, enforce scan limits, process payments when paid features are enabled, debug
            the beta, and improve product reliability. Product-event telemetry does not include
            comic titles, notes, uploaded images, or grading reasoning.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Service providers</h2>
          <p className="mt-2">
            CoverGrail uses infrastructure providers including Supabase and Netlify. When live AI
            grading is enabled, submitted comic photos and the comic details needed for analysis may
            be sent to the configured AI provider. Stripe may process payment information for paid
            features. CoverGrail does not store full payment-card numbers.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Deletion</h2>
          <p className="mt-2">
            Signed-in users can request account deletion from the Account page. The deletion flow
            removes the account, stored comic images, scans, results, confirmed grades, feedback,
            and associated product-event records from CoverGrail systems.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Beta notice</h2>
          <p className="mt-2">
            CoverGrail is an early-stage beta. This notice may be updated as the product, providers,
            and data practices change.
          </p>
        </section>
      </div>
      <Link href="/" className="mt-10 inline-flex text-sm font-semibold text-amber-400 hover:underline">← Back to CoverGrail</Link>
    </main>
  );
}
