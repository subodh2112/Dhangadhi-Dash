import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageHero title="Privacy Policy" subtitle="How Dhangadhi Dash collects, uses, and protects your data." icon={Shield} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <p className="text-xs text-foreground/40">Last updated: July 2026</p>

        <Section title="1. Introduction">
          <p>Dhangadhi Dash ("we", "us", "our") operates a hyper-local delivery platform connecting customers with restaurants, grocery stores, pharmacies, and local shops in Dhangadhi, Nepal. This Privacy Policy explains how we collect, use, and protect your personal information when you use our app and services.</p>
        </Section>

        <Section title="2. Information We Collect">
          <p>We collect the following types of information:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account Information:</strong> Name, email, phone number, and password (encrypted).</li>
            <li><strong>Delivery Information:</strong> Delivery address, contact number, and delivery instructions.</li>
            <li><strong>Order Data:</strong> Order history, payment method, and transaction records.</li>
            <li><strong>Location Data:</strong> GPS location during order placement and delivery tracking.</li>
            <li><strong>Device Information:</strong> Device type, OS version, and app usage analytics.</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use your information to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Process and deliver your orders efficiently.</li>
            <li>Connect you with nearby riders and partner stores.</li>
            <li>Process payments and issue refunds.</li>
            <li>Provide customer support and resolve issues.</li>
            <li>Send order updates, promotions, and service notifications.</li>
            <li>Improve our services, recommendations, and delivery routes.</li>
          </ul>
        </Section>

        <Section title="4. Data Sharing">
          <p>We share your information only as necessary:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Partner Stores & Riders:</strong> Your name, address, and contact number are shared with the assigned store and rider for order fulfillment.</li>
            <li><strong>Payment Processors:</strong> Transaction data is shared with eSewa, Khalti, FonePay, and other payment gateways to process payments securely.</li>
            <li><strong>Legal Compliance:</strong> We may disclose information if required by law or to protect our rights and safety.</li>
          </ul>
          <p>We never sell your personal data to third parties.</p>
        </Section>

        <Section title="5. Data Security">
          <p>We implement industry-standard security measures including SSL encryption, secure password hashing, and restricted access controls. Payment information is processed through PCI-compliant gateways and is never stored on our servers. While we strive to protect your data, no method of transmission over the internet is 100% secure.</p>
        </Section>

        <Section title="6. Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access and review your personal data.</li>
            <li>Correct inaccurate information.</li>
            <li>Request deletion of your account and associated data.</li>
            <li>Opt out of promotional communications at any time.</li>
            <li>Download a copy of your order history.</li>
          </ul>
          <p>To exercise these rights, contact us through the app's Help Center.</p>
        </Section>

        <Section title="7. Data Retention">
          <p>We retain your data for as long as your account is active. Order and transaction records are kept for a minimum of 3 years for legal and tax compliance. After this period, data is deleted or anonymized.</p>
        </Section>

        <Section title="8. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes through the app or via email. Continued use of the service after changes constitutes acceptance of the updated policy.</p>
        </Section>

        <Section title="9. Contact Us">
          <p>If you have questions about this Privacy Policy or your data, please reach out through our Help Center or contact our support team at Dhangadhi, Kailali, Nepal.</p>
        </Section>
      </div>
      <Footer />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-foreground mb-3">{title}</h2>
      <div className="text-foreground/70 text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  );
}