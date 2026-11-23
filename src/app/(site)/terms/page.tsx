import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";
import { pageMetadata } from "@/lib/seo";

const intro = "The terms that apply when you use the Induqora website and its content.";

export const metadata: Metadata = pageMetadata({ title: "Terms of Use", description: intro, path: "/terms" });

export default function TermsPage() {
  return (
    <StaticPage title="Terms of Use" intro={intro} path="/terms" lastUpdated="2026-11-22">
      <h2>Use of content</h2>
      <p>
        All articles, graphics and other content on Induqora are protected by copyright. You may quote short excerpts with attribution and a link
        to the original article. Republishing full articles requires written permission.
      </p>

      <h2>No professional advice</h2>
      <p>
        Content is provided for general information. Industrial control systems can affect safety, equipment and the environment. Always follow
        applicable standards, manufacturer documentation and your organization’s safety procedures, and consult qualified engineers before
        applying any technique described here to a live system.
      </p>

      <h2>Accuracy</h2>
      <p>
        We work hard to keep content accurate and current, but we make no warranty that it is complete or error-free. See our editorial policy for
        how we handle corrections.
      </p>

      <h2>Third-party links and trademarks</h2>
      <p>
        Links to external sites are provided for convenience; we are not responsible for their content. Product names and trademarks belong to
        their respective owners.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the extent permitted by law, Induqora is not liable for any loss or damage arising from use of this website or reliance on its content.
      </p>
    </StaticPage>
  );
}
