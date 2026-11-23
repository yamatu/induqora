import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { StaticPage } from "@/components/StaticPage";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const intro = "Send a news tip, request a correction, pitch an article or ask about partnerships. Our editors read every message.";

export const metadata: Metadata = pageMetadata({ title: "Contact Induqora", description: intro, path: "/contact" });

export default function ContactPage() {
  return (
    <StaticPage title="Contact Induqora" intro={intro} path="/contact" schemaType="ContactPage">
      <p>
        Prefer email? Write to <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>. For security-sensitive tips about
        unpatched vulnerabilities, please say so in your first message and we will arrange a secure channel.
      </p>
      <ContactForm />
    </StaticPage>
  );
}
