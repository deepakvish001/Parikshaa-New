import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

const Terms = () => (
  <LegalLayout
    title="Terms of Service"
    updated="September 2026"
    intro="These terms govern your use of Parikshaa. By creating an account you agree to them."
  >
    <Helmet>
      <title>Terms of Service | Parikshaa</title>
      <meta
        name="description"
        content="Read the Parikshaa Terms of Service covering accounts, acceptable use, content ownership and account termination."
      />
      <link rel="canonical" href="https://parikshaa.org/terms" />
    </Helmet>

    <LegalSection title="1. Your account">
      <p>
        You must provide accurate information when signing up and keep your password secure. You are
        responsible for all activity that happens under your account. One person, one account.
      </p>
    </LegalSection>

    <LegalSection title="2. Acceptable use">
      <p>You agree not to:</p>
      <ul>
        <li>Scrape, resell or redistribute problems, sheets, solutions or articles.</li>
        <li>Cheat, impersonate others or manipulate contests, streaks and leaderboards.</li>
        <li>Upload unlawful, abusive, misleading or infringing content.</li>
        <li>Attempt to break, overload or gain unauthorised access to the platform.</li>
      </ul>
      <p>We may suspend or remove accounts that break these rules.</p>
    </LegalSection>

    <LegalSection title="3. Your content">
      <p>
        You keep ownership of the code, notes, interview experiences and comments you post. By
        posting publicly you grant us a licence to host, display and share that content within the
        platform. You can request removal at any time.
      </p>
    </LegalSection>

    <LegalSection title="4. Our content">
      <p>
        Sheets, curated problem sets, articles, visualisers and AI-generated explanations are
        provided for personal learning only. Commercial reuse requires written permission.
      </p>
    </LegalSection>

    <LegalSection title="5. AI features">
      <p>
        Mentor chat, code reviews and generated explanations can be incomplete or wrong. Treat them
        as study aids, not authoritative answers, and always verify before relying on them.
      </p>
    </LegalSection>

    <LegalSection title="6. Availability and changes">
      <p>
        The service is provided "as is". We may add, change or discontinue features, and we do not
        guarantee uninterrupted availability or that any outcome, job or result will follow from use.
      </p>
    </LegalSection>

    <LegalSection title="7. Termination">
      <p>
        You may delete your account at any time from Settings. We may suspend accounts that violate
        these terms or applicable law.
      </p>
    </LegalSection>

    <LegalSection title="8. Contact">
      <p>
        Questions about these terms? Reach us through the support page, or read our{" "}
        <Link to="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </LegalSection>
  </LegalLayout>
);

export default Terms;
