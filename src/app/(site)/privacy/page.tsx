import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const intro = "How Induqora collects, uses and protects personal information.";

export const metadata: Metadata = pageMetadata({ title: "Privacy Policy", description: intro, path: "/privacy" });

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy" intro={intro} path="/privacy" lastUpdated="2026-11-22">
      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Newsletter:</strong> your email address and the page where you subscribed.
        </li>
        <li>
          <strong>Contact form:</strong> the name, email, company and message you submit.
        </li>
        <li>
          <strong>Server logs:</strong> standard technical data such as IP address, browser type and pages requested, kept for security and
          troubleshooting.
        </li>
      </ul>

      <h2>How we use it</h2>
      <p>
        We use your information only to send the newsletter you requested, respond to your message, and operate and secure the website. We do not
        sell personal information.
      </p>

      <h2>Cookies</h2>
      <p>
        The public website does not set advertising or tracking cookies. A strictly necessary session cookie is used only in the editorial
        administration area.
      </p>

      <h2>Retention and your rights</h2>
      <p>
        You can unsubscribe from the newsletter at any time. You may request access to, correction of, or deletion of your personal data by
        emailing <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>. Depending on where you live, you may have
        additional rights under laws such as the GDPR or CCPA.
      </p>

      <h2>Changes</h2>
      <p>We will update this page if our practices change and revise the “Last updated” date above.</p>
    </StaticPage>
  );
}
