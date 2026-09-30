import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Beta terms</p>
      <h1 className="mt-3 text-4xl font-semibold text-zinc-50">CoverGrail Beta Terms</h1>
      <div className="mt-8 space-y-6 text-sm leading-7 text-zinc-300">
        <p>
          CoverGrail is a pre-submission decision-support tool for comic collectors. By using the
          beta, you understand that results are estimates and may differ materially from any
          professional grading company&apos;s final grade.
        </p>
        <section>
          <h2 className="text-lg font-semibold text-zinc-100">No official grading relationship</h2>
          <p className="mt-2">
            CoverGrail is not affiliated with, endorsed by, or an agent of CGC, CBCS, or any other
            grading company. A CoverGrail estimate is not a certification, appraisal, guarantee,
            or official grade.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Use your own judgment</h2>
          <p className="mt-2">
            Recommendations about submitting, pressing, selling raw, grading costs, or potential
            upside are educational estimates. Market prices, fees, restoration, hidden defects, and
            professional grading outcomes can change the result.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Your uploads</h2>
          <p className="mt-2">
            You are responsible for having the right to upload the images and information you
            submit. Do not upload unlawful content or information you are not authorized to share.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Beta availability</h2>
          <p className="mt-2">
            Features may change, fail, or be withdrawn during the beta. CoverGrail may limit usage
            to protect the service, prevent abuse, or control third-party processing costs.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-zinc-100">Account deletion</h2>
          <p className="mt-2">
            You can request deletion of your account and associated CoverGrail data from the
            Account page.
          </p>
        </section>
      </div>
      <Link href="/" className="mt-10 inline-flex text-sm font-semibold text-amber-400 hover:underline">← Back to CoverGrail</Link>
    </main>
  );
}
