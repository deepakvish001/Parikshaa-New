import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { LegalLayout, LegalSection } from "@/components/legal/LegalLayout";

const Privacy = () => (
  <LegalLayout
    title="Privacy Policy"
    updated="September 2026"
    intro="This policy explains what we collect when you use Parikshaa, why we collect it, and the control you have over it."
  >
    <Helmet>
      <title>Privacy Policy | Parikshaa</title>
      <meta
        name="description"
        content="How Parikshaa collects, uses, stores and protects your personal data, and the choices you have over your information."
      />
      <link rel="canonical" href="https://parikshaa.org/privacy" />
    </Helmet>

    <LegalSection title="1. What we collect">
      <ul>
        <li>
          <strong>Account details</strong> — name, email and password (stored encrypted), plus
          anything you add to your profile such as photo, bio, college or links.
        </li>
        <li>
          <strong>Learning activity</strong> — problems solved, submissions, quiz results, streaks,
          notes, bookmarks and contest participation.
        </li>
        <li>
          <strong>Usage data</strong> — pages visited, device and browser information, and basic
          referral data used to improve the product.
        </li>
      </ul>
    </LegalSection>

    <LegalSection title="2. How we use it">
      <ul>
        <li>To run your account, save progress and personalise roadmaps and recommendations.</li>
        <li>To show public profiles, leaderboards and community posts you choose to share.</li>
        <li>To send notifications you have enabled, and important service updates.</li>
        <li>To detect abuse, cheating and security problems.</li>
      </ul>
      <p>We do not sell your personal data.</p>
    </LegalSection>

    <LegalSection title="3. What others can see">
      <p>
        Your public profile shows only your display name, photo, badges and public progress. Email
        address, private notes and settings are never shown to other users. You can hide yourself
        from leaderboards in Settings.
      </p>
    </LegalSection>

    <LegalSection title="4. AI features">
      <p>
        When you use mentor chat or code review, the relevant question, code or prompt is sent to an
        AI provider to generate a response. Don't paste passwords, keys or confidential material
        into these features.
      </p>
    </LegalSection>

    <LegalSection title="5. Storage and security">
      <p>
        Data is stored on managed cloud infrastructure with encryption in transit and access
        controls that restrict rows to their owner. No system is perfectly secure, so please use a
        strong, unique password.
      </p>
    </LegalSection>

    <LegalSection title="6. Your choices">
      <ul>
        <li>View and edit your information at any time from Settings.</li>
        <li>Turn email and push notifications on or off.</li>
        <li>Delete your account, which removes your personal data and public profile.</li>
        <li>Request a copy of your data through support.</li>
      </ul>
    </LegalSection>

    <LegalSection title="7. Cookies">
      <p>
        We use essential cookies and local storage to keep you signed in and remember preferences,
        plus limited analytics to understand how the platform is used.
      </p>
    </LegalSection>

    <LegalSection title="8. Contact">
      <p>
        For any privacy question, reach us through the support page. See also our{" "}
        <Link to="/terms" className="text-primary hover:underline">
          Terms of Service
        </Link>
        .
      </p>
    </LegalSection>
  </LegalLayout>
);

export default Privacy;
