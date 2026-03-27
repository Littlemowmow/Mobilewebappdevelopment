import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router"

export function Privacy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-orange-500 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          Privacy Policy
        </h1>
        <p className="text-zinc-400 dark:text-zinc-500 text-sm mb-8">
          Last updated: March 2026
        </p>

        <div className="space-y-6 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              1. Who We Are
            </h2>
            <p>
              Weventr ("we", "our", "us") is a collaborative travel planning
              application. This privacy policy explains how we collect, use, and
              protect your personal information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              2. Information We Collect
            </h2>
            <p className="mb-3">
              We collect the following information to provide and improve our service:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-zinc-900 dark:text-white">Account information:</strong>{" "}
                your email address, display name, and password (securely hashed).
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-white">Trip data:</strong>{" "}
                trip plans you create or join, including destinations, dates, budgets,
                and itinerary details.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-white">Activity preferences:</strong>{" "}
                your swipes, votes, and selections on suggested activities and
                destinations.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-white">Location preferences:</strong>{" "}
                destination cities and regions you express interest in (we do not
                track your real-time GPS location).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To create and manage your account.</li>
              <li>To enable collaborative trip planning with other users.</li>
              <li>To personalize activity and destination recommendations.</li>
              <li>To send trip-related notifications (invite links, plan updates).</li>
              <li>To improve the app experience based on aggregated, anonymized usage patterns.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              4. Data Storage and Security
            </h2>
            <p>
              Your data is stored securely using{" "}
              <strong className="text-zinc-900 dark:text-white">Supabase</strong>, a
              hosted PostgreSQL platform with row-level security, encrypted
              connections, and regular backups. Authentication is handled through
              Supabase Auth with industry-standard password hashing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              5. Third-Party Tracking
            </h2>
            <p>
              We do <strong className="text-zinc-900 dark:text-white">not</strong> use
              third-party analytics, advertising trackers, or cookies for tracking
              purposes. We do not sell, rent, or share your personal data with
              advertisers or data brokers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              6. Data Sharing
            </h2>
            <p>
              Your trip data is shared only with other members of trips you create or
              join. We do not share your personal information with third parties
              except when required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              7. Your Rights
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-zinc-900 dark:text-white">Access:</strong>{" "}
                You can view all data associated with your account within the app.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-white">Correction:</strong>{" "}
                You can update your profile information at any time.
              </li>
              <li>
                <strong className="text-zinc-900 dark:text-white">Deletion:</strong>{" "}
                You may request complete deletion of your account and all associated
                data by contacting us at{" "}
                <a
                  href="mailto:weventrapp@gmail.com"
                  className="text-orange-500 hover:underline"
                >
                  weventrapp@gmail.com
                </a>
                . We will process deletion requests within 30 days.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              8. Children's Privacy
            </h2>
            <p>
              Weventr is not directed at children under 13. We do not knowingly
              collect information from children under 13. If we learn that we have
              collected personal data from a child under 13, we will delete it
              promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this privacy policy from time to time. If we make
              significant changes, we will notify you through the app or via email.
              Continued use of Weventr after changes constitutes acceptance of the
              updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              10. Contact Us
            </h2>
            <p>
              If you have questions about this privacy policy or your data, contact
              us at{" "}
              <a
                href="mailto:weventrapp@gmail.com"
                className="text-orange-500 hover:underline"
              >
                weventrapp@gmail.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-400 dark:text-zinc-600 text-xs text-center">
            Weventr &mdash; Plan trips together.
          </p>
        </div>
      </div>
    </div>
  )
}
