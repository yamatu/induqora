import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const intro =
  "Induqora is an independent publication covering industrial automation and control — the PLCs, control systems, networks and software that run factories, process plants and critical infrastructure.";

export const metadata: Metadata = pageMetadata({ title: "About Induqora", description: intro, path: "/about" });

export default function AboutPage() {
  return (
    <StaticPage title="About Induqora" intro={intro} path="/about" schemaType="AboutPage">
      <h2>What we cover</h2>
      <p>
        Induqora publishes two kinds of content. <Link href="/news">News</Link> reports on product launches, security advisories, standards
        updates, regulation and market developments that affect automation professionals.{" "}
        <Link href="/blog">Insights</Link> are evergreen guides and analysis that explain how industrial technologies work and how to apply
        them well.
      </p>
      <ul>
        <li>PLCs, PACs and controller programming (IEC 61131-3)</li>
        <li>Distributed control systems and process automation</li>
        <li>SCADA, HMI and industrial software</li>
        <li>Industrial networking: PROFINET, EtherNet/IP, Modbus, OPC UA, TSN, MQTT</li>
        <li>OT and ICS cybersecurity, including IEC 62443</li>
        <li>Motion control, drives and robotics</li>
        <li>Industrial IoT, edge computing and smart manufacturing</li>
      </ul>

      <h2>Who we write for</h2>
      <p>
        Our readers are controls and automation engineers, system integrators, maintenance and reliability teams, OT security practitioners and
        plant leaders. We assume technical literacy and aim to save readers time: every article should leave you able to make a better
        engineering or business decision.
      </p>

      <h2>How we work</h2>
      <p>
        Every article carries a named author, a publication date and — when it changes materially — an update date. We cite primary sources such
        as standards bodies, vendor security advisories, regulatory texts and technical documentation wherever possible. Read our full{" "}
        <Link href="/editorial-policy">editorial policy</Link> for how we source, fact-check, correct and separate editorial from commercial
        content.
      </p>

      <h2>Independence</h2>
      <p>
        Induqora is not owned by, or affiliated with, any automation vendor. Vendor names and trademarks mentioned on this site belong to their
        respective owners and are used for identification only.
      </p>

      <h2>Contact</h2>
      <p>
        News tips, corrections and partnership enquiries are welcome. Reach the editors at{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a> or use our <Link href="/contact">contact form</Link>.
      </p>
    </StaticPage>
  );
}
