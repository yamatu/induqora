import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const intro =
  "The standards Induqora follows when reporting, writing, fact-checking, correcting and updating content about industrial automation and control.";

export const metadata: Metadata = pageMetadata({ title: "Editorial Policy", description: intro, path: "/editorial-policy" });

export default function EditorialPolicyPage() {
  return (
    <StaticPage title="Editorial Policy" intro={intro} path="/editorial-policy" lastUpdated="2026-11-22">
      <h2 id="mission">Our mission</h2>
      <p>
        Induqora exists to give automation professionals accurate, useful and clearly sourced information. We prioritize technical correctness
        and practical value over speed or volume.
      </p>

      <h2 id="sourcing">Sourcing and verification</h2>
      <ul>
        <li>We prefer primary sources: standards documents, regulatory texts, official vendor advisories and release notes, and published research.</li>
        <li>Technical claims are checked against documentation or verified by a qualified reviewer before publication.</li>
        <li>Each article lists its key sources in a “Sources and further reading” section so readers can verify our work.</li>
        <li>We clearly distinguish reported facts from analysis and opinion.</li>
      </ul>

      <h2 id="ai">Use of AI tools</h2>
      <p>
        Editors may use software tools, including AI assistants, for research support, transcription and copy-editing. A named human author is
        responsible for every article, and all facts, figures and technical recommendations are reviewed by a person before publication.
      </p>

      <h2 id="updates">Updates</h2>
      <p>
        Evergreen guides are reviewed periodically. When we materially revise an article, we change its “Updated” date. Minor edits such as typo
        fixes do not change the date.
      </p>

      <h2 id="corrections">Corrections</h2>
      <p>
        If we get something wrong, we fix it promptly and transparently. Substantive corrections are noted at the end of the article with a
        description of what changed. To report an error, email <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a> or use
        the <Link href="/contact">contact form</Link>.
      </p>

      <h2 id="independence">Independence and conflicts of interest</h2>
      <ul>
        <li>Vendors cannot buy editorial coverage or review articles before publication.</li>
        <li>Any sponsored content is clearly labeled “Sponsored” and kept separate from editorial content.</li>
        <li>Authors disclose relevant relationships with companies they cover.</li>
        <li>Links to vendor sites are editorial unless marked as sponsored.</li>
      </ul>

      <h2 id="security">Responsible security reporting</h2>
      <p>
        When covering vulnerabilities in industrial products, we report on published advisories and coordinated disclosures. We do not publish
        exploit code or operational details that would materially help attackers before patches or mitigations are available.
      </p>
    </StaticPage>
  );
}
