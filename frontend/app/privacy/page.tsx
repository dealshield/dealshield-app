import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#030014]">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <div className="glass-card p-8 md:p-12 rounded-2xl relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#7042f8]/10 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#00d4ff]/10 rounded-full blur-3xl -z-10" />

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-400 mb-8">Last Updated: December 28, 2025</p>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            <section>
              <p>
                DealShield ("we," "us," or "our") is committed to protecting your privacy. As a decentralized, open-source marketplace (dApp) built on the Solana blockchain, we prioritize minimal data collection and decentralization. However, to enable successful physical product deliveries in peer-to-peer transactions, we collect limited personal information related to shipping.
              </p>
              <p className="mt-4">
                This Privacy Policy explains how we collect, use, store, share, and protect your information. By using DealShield, you consent to the practices described herein. We comply with applicable privacy laws, including the General Data Protection Regulation (GDPR) where relevant.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">1.</span> Information We Collect
              </h2>
              <p className="mb-4">We collect only the data necessary for platform functionality and transaction fulfillment:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-[#7042f8]">
                <li><strong>Wallet Information:</strong> Your public Solana wallet address (used for authentication and on-chain transactions). This is pseudonymous and publicly visible on the blockchain.</li>
                <li><strong>Shipping and Delivery Information (Provided by Buyers):</strong> When purchasing a physical product, buyers must provide their full name, shipping address (including location details), and phone number. This is required for the seller to fulfill and ship the order successfully.</li>
                <li><strong>Listing and Transaction Data:</strong> Product descriptions, images (stored on decentralized storage like IPFS/Arweave), prices, and on-chain escrow details (public on Solana).</li>
                <li><strong>Optional Information:</strong> Any additional details you voluntarily provide (e.g., notes for sellers).</li>
                <li><strong>Automatically Collected Data:</strong> Limited anonymized usage data (e.g., via privacy-respecting analytics) for platform improvement—no IP logging or tracking tied to wallets.</li>
              </ul>
              <p className="mt-4">
                We do not collect or store payment details (handled directly by your wallet and the Solana blockchain), emails (unless optionally provided), or other unnecessary personal data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">2.</span> How We Collect Information
              </h2>
              <ul className="list-disc pl-5 space-y-2 marker:text-[#7042f8]">
                <li><strong>Directly from You:</strong> Shipping details are entered by buyers during checkout and shared directly with the seller for fulfillment.</li>
                <li><strong>On-Chain:</strong> Transaction and escrow data is recorded publicly on Solana.</li>
                <li><strong>Off-Chain (Minimal):</strong> Shipping information is stored temporarily in our lightweight database (e.g., Supabase/PostgreSQL) to facilitate order tracking.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">3.</span> How We Use Information
              </h2>
              <p className="mb-4">We use collected information solely for:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-[#7042f8]">
                <li>Enabling transaction fulfillment (e.g., providing shipping details to sellers for delivery).</li>
                <li>Operating the platform (e.g., displaying orders in your dashboard).</li>
                <li>Resolving disputes (if initiated via community DAO).</li>
                <li>Improving usability (anonymized analytics only).</li>
                <li>Complying with legal obligations.</li>
              </ul>
              <p className="mt-4">
                Shipping information is used exclusively for delivery purposes and is not used for marketing, profiling, or any other secondary purpose.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">4.</span> Data Sharing and Disclosure
              </h2>
              <ul className="list-disc pl-5 space-y-2 marker:text-[#7042f8]">
                <li><strong>With Sellers:</strong> Buyers' name, shipping address, and phone number are shared directly with the seller upon escrow funding, solely for order fulfillment and shipping.</li>
                <li><strong>No Third-Party Sharing:</strong> We do not sell, rent, or share your information with marketers, advertisers, or unrelated parties.</li>
                <li><strong>Service Providers:</strong> Limited access may be granted to infrastructure providers (e.g., database hosting, IPFS storage) under strict confidentiality.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law, to protect rights/safety, or in response to valid requests.</li>
                <li><strong>On-Chain Data:</strong> Blockchain transactions are public and immutable.</li>
              </ul>
              <p className="mt-4">
                To enhance privacy, we encourage the use of features like Zero-Knowledge proofs (via Light Protocol) for shielding sensitive details where possible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">5.</span> Data Storage and Retention
              </h2>
              <ul className="list-disc pl-5 space-y-2 marker:text-[#7042f8]">
                <li><strong>Storage:</strong> On-chain data is permanent on Solana. Off-chain shipping data is stored securely and minimally.</li>
                <li><strong>Retention:</strong> Shipping information is retained only as long as needed for the transaction (e.g., until confirmation or dispute resolution, typically up to 30 days post-delivery). It is then deleted automatically.</li>
                <li><strong>Security:</strong> We implement reasonable measures (e.g., encryption, access controls) to protect off-chain data. However, no system is 100% secure—use at your own risk.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">6.</span> Your Rights and Choices
              </h2>
              <p className="mb-4">Under laws like GDPR (if applicable), you have rights including:</p>
              <ul className="list-disc pl-5 space-y-2 marker:text-[#7042f8]">
                <li>Access, correction, or deletion of your data.</li>
                <li>Objection to processing or restriction.</li>
                <li>Data portability.</li>
              </ul>
              <p className="mt-4">
                To exercise rights or request deletion of shipping data post-transaction, contact us via community channels (e.g., X or Discord). Note: On-chain data cannot be deleted due to blockchain immutability.
              </p>
              <p>You control your wallet and can disconnect anytime.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">7.</span> International Data Transfers
              </h2>
              <p>
                As a global platform, data may be processed in various jurisdictions. We ensure appropriate safeguards for transfers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">8.</span> Children's Privacy
              </h2>
              <p>
                DealShield is not intended for users under 18. We do not knowingly collect data from children.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">9.</span> Changes to This Policy
              </h2>
              <p>
                We may update this Policy. Significant changes will be notified via the platform or community. Continued use constitutes acceptance.
              </p>
              <p className="mt-4 pt-4 border-t border-white/10">
                For questions or concerns, reach us via our <a href="https://x.com/dealshieldsol" target="_blank" rel="noopener noreferrer" className="text-[#00d4ff] hover:text-[#7042f8] transition-colors font-medium">community channels</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
