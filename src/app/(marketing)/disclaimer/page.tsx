import Link from "next/link";
import { Disclaimer } from "@/components/disclaimer";

export default function DisclaimerPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
        Disclaimer
      </h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-400">
        <Disclaimer className="text-sm text-zinc-400" />
        <p>
          CoverGrail provides educational, pre-submission estimates based solely
          on the images and metadata you supply. Lighting, camera quality,
          glare, cropping, and undisclosed restoration may change outcomes.
        </p>
        <p>
          Predicted grade ranges are not official grades and must not be used
          as guarantees for resale, insurance, or submission decisions without
          your own diligence.
        </p>
        <p>
          References to third-party graders (for example CGC or CBCS) are for
          context only; CoverGrail is independent and unaffiliated.
        </p>
      </div>
      <Link
        href="/"
        className="mt-10 inline-flex text-sm font-medium text-amber-400 hover:underline"
      >
        Back to home
      </Link>
    </main>
  );
}
