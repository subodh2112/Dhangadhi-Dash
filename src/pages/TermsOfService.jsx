import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageHero title="Terms of Service" subtitle="The legal agreement between Dhangadhi Dash, our customers, and business partners." icon={FileText} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <p className="text-xs text-foreground/40">Last updated: July 2026</p>

        <Section title="1. Acceptance of Terms">
          <p>By using the Dhangadhi Dash app and services, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our services. These terms apply to all users: customers, merchant partners, and delivery riders.</p>
        </Section>

        <Section title="2. Account Registration">
          <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account and password. You must be at least 16 years old to use our services. Any activity under your account is your responsibility.</p>
        </Section>

        <Section title="3. Customer Terms">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Orders:</strong> You agree to provide accurate delivery information and be available to receive your order at the specified time.</li>
            <li><strong>Payments:</strong> You agree to pay for all orders placed. We support Cash on Delivery (COD), eSewa, Khalti, FonePay, and card payments.</li>
            <li><strong>Cancellations:</strong> Orders can be cancelled before preparation begins. Once preparation starts, cancellation may not be possible.</li>
            <li><strong>Conduct:</strong> You must treat riders and partner staff with respect. Abuse, threats, or harassment will result in account suspension.</li>
          </ul>
        </Section>

        <Section title="4. Merchant Partner Terms">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Partnership:</strong> Merchants must provide valid business registration, PAN, and comply with local health and safety regulations.</li>
            <li><strong>Quality:</strong> Merchants are responsible for the quality, freshness, and safety of products delivered through the platform.</li>
            <li><strong>Pricing:</strong> Merchants set their own prices. Dhangadhi Dash charges a commission on each completed order.</li>
            <li><strong>Fulfillment:</strong> Merchants must prepare orders within the estimated time and maintain accurate inventory and availability.</li>
          </ul>
        </Section>

        <Section title="5. Rider Terms">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Eligibility:</strong> Riders must hold a valid driving license and be at least 18 years old.</li>
            <li><strong>Conduct:</strong> Riders must follow traffic laws, wear helmets, and maintain their vehicles in safe working condition.</li>
            <li><strong>Deliveries:</strong> Riders must deliver orders promptly and professionally. Tampering with orders is strictly prohibited.</li>
            <li><strong>Earnings:</strong> Rider earnings are calculated per delivery and may include tips. Payouts are processed according to the agreed schedule.</li>
          </ul>
        </Section>

        <Section title="6. Prohibited Activities">
          <p>You must not:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the service for any illegal or fraudulent purpose.</li>
            <li>Place fake or fraudulent orders.</li>
            <li>Manipulate ratings, reviews, or the platform's algorithms.</li>
            <li>Share your account credentials with others.</li>
            <li>Interfere with the proper functioning of the platform.</li>
          </ul>
        </Section>

        <Section title="7. Liability & Disclaimers">
          <p>Dhangadhi Dash acts as a platform connecting customers, merchants, and riders. We are not responsible for the quality of products sold by partner stores. Our liability is limited to the order value. We are not liable for indirect, incidental, or consequential damages arising from the use of our services.</p>
        </Section>

        <Section title="8. Refunds & Disputes">
          <p>Refund requests must be submitted within 24 hours of delivery. Refunds are processed to the original payment method within 5-7 business days. For disputes, contact our support team through the Help Center. We aim to resolve all disputes within 48 hours.</p>
        </Section>

        <Section title="9. Changes to Terms">
          <p>We reserve the right to modify these Terms at any time. Continued use of the service after changes constitutes acceptance of the updated terms. We will notify users of significant changes through the app.</p>
        </Section>

        <Section title="10. Governing Law">
          <p>These Terms are governed by the laws of Nepal. Any disputes shall be subject to the exclusive jurisdiction of the courts in Dhangadhi, Kailali, Nepal.</p>
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