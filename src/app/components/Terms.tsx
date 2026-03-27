import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router"

export function Terms() {
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
          Terms of Service
        </h1>
        <p className="text-zinc-400 dark:text-zinc-500 text-sm mb-8">
          Last updated: March 2026
        </p>

        <div className="space-y-6 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By creating an account or using Weventr ("the Service"), you agree to
              be bound by these Terms of Service. If you do not agree, please do not
              use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              2. Description of Service
            </h2>
            <p>
              Weventr is a collaborative travel planning application that helps
              groups discover destinations, vote on activities, and organize trip
              itineraries. The Service is currently in{" "}
              <strong className="text-zinc-900 dark:text-white">beta</strong> and is
              provided free of charge. Features, availability, and functionality may
              change without notice during the beta period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              3. User Accounts
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You must provide a valid email address and accurate information.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 13 years old to use the Service.</li>
              <li>One person may not maintain more than one account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              4. User-Generated Content
            </h2>
            <p className="mb-3">
              You may create trip plans, vote on activities, add destinations, and
              share content with other trip members ("User Content"). By posting User
              Content, you:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Retain ownership of your content.</li>
              <li>
                Grant Weventr a limited license to store, display, and share your
                content with other members of your trips as necessary to operate the
                Service.
              </li>
              <li>
                Confirm that your content does not violate any third-party rights or
                applicable laws.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              5. Travel Recommendations Disclaimer
            </h2>
            <p>
              Weventr provides activity suggestions, destination information, and
              travel recommendations for planning purposes only. We{" "}
              <strong className="text-zinc-900 dark:text-white">
                do not guarantee
              </strong>{" "}
              the accuracy, safety, availability, or quality of any travel
              recommendation, venue, activity, or destination surfaced through the
              Service. You are solely responsible for verifying travel details,
              safety conditions, and making informed travel decisions. Weventr is not
              a travel agency and does not book travel on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              6. Respectful Use Policy
            </h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Use the Service to harass, abuse, or threaten other users.</li>
              <li>Post offensive, discriminatory, or illegal content.</li>
              <li>Attempt to gain unauthorized access to other accounts or our systems.</li>
              <li>Use the Service for any commercial or spam purposes.</li>
              <li>Interfere with or disrupt the Service or its infrastructure.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              7. Account Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your account at any time,
              with or without notice, for conduct that we determine violates these
              Terms or is harmful to other users, us, or third parties. You may also
              delete your account at any time by contacting us at{" "}
              <a
                href="mailto:weventrapp@gmail.com"
                className="text-orange-500 hover:underline"
              >
                weventrapp@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              8. Limitation of Liability
            </h2>
            <p>
              The Service is provided "as is" and "as available" without warranties
              of any kind. To the fullest extent permitted by law, Weventr shall not
              be liable for any indirect, incidental, special, consequential, or
              punitive damages arising from your use of the Service, including but
              not limited to travel disruptions, data loss, or reliance on
              recommendations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              9. Changes to These Terms
            </h2>
            <p>
              We may update these Terms from time to time. If we make material
              changes, we will notify you through the app or via email. Continued use
              of the Service after changes constitutes acceptance of the updated
              Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              10. Contact Us
            </h2>
            <p>
              If you have questions about these Terms, contact us at{" "}
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
