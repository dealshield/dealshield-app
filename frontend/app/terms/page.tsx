import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Terms and Conditions</h1>
          <p className="text-gray-400 mb-8">Last Updated: December 28, 2025</p>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            <section>
              <p>
                These Terms and Conditions ("Terms") govern your access to and use of DealShield (the "Platform"), a decentralized, open-source marketplace built on the Solana blockchain. The Platform is provided as a decentralized application (dApp) and facilitates peer-to-peer transactions using on-chain escrow smart contracts. By connecting your wallet, accessing, or using the Platform, you agree to be bound by these Terms.
              </p>
              <p className="mt-4">
                DealShield is fully open-source under the MIT license, with code available on GitHub. The Platform operates in a decentralized manner; smart contracts execute automatically, and no central entity controls user funds or transactions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">1.</span> Eligibility
              </h2>
              <p>
                You must be at least 18 years old (or the age of majority in your jurisdiction) to use the Platform. You represent that you are not barred from using the Platform under applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">2.</span> Decentralized Nature and Risks
              </h2>
              <ul className="list-disc pl-5 space-y-2 marker:text-[#7042f8]">
                <li>The Platform is a non-custodial dApp. You retain full control of your private keys and wallet.</li>
                <li>Transactions are executed via smart contracts on the Solana blockchain. Once confirmed, they are irreversible.</li>
                <li>Blockchain technology involves risks, including volatility in cryptocurrency prices, network congestion, smart contract vulnerabilities, and potential loss of funds due to user error or exploits.</li>
                <li>DealShield does not guarantee the performance, security, or availability of the Solana network or third-party services (e.g., wallets, oracles like Pyth).</li>
                <li>You are solely responsible for safeguarding your wallet, seed phrase, and private keys. DealShield has no access to them and cannot recover lost funds.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">3.</span> User Responsibilities
              </h2>
              <ul className="list-disc pl-5 space-y-2 marker:text-[#7042f8]">
                <li><strong>Accurate Information:</strong> When creating listings, provide truthful descriptions, prices, and shipping details.</li>
                <li><strong>Compliance:</strong> You must comply with all applicable laws, including tax, export, and consumer protection regulations. Prohibited items include illegal goods, weapons, drugs, or counterfeit products.</li>
                <li><strong>Transactions:</strong> Buyers and sellers are responsible for fulfillment (e.g., shipping physical goods). Escrow protects payments but does not guarantee delivery or quality.</li>
                <li><strong>Fees:</strong> A fixed 0.01 SOL fee is added to each purchase and directed to a platform treasury. Solana network fees apply separately.</li>
                <li><strong>Prohibited Conduct:</strong> No fraud, scams, spam, harassment, or attempts to exploit the Platform or smart contracts.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">4.</span> Escrow Mechanism
              </h2>
              <ul className="list-disc pl-5 space-y-2 marker:text-[#7042f8]">
                <li>Funds are locked in on-chain escrow upon purchase.</li>
                <li>Release occurs upon buyer confirmation or auto-conditions (e.g., timeout refund after 14 days).</li>
                <li>Disputes may be resolved via community DAO voting (if implemented).</li>
                <li>DealShield is not a party to transactions and assumes no liability for non-delivery, defects, or disputes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">5.</span> Intellectual Property
              </h2>
              <ul className="list-disc pl-5 space-y-2 marker:text-[#7042f8]">
                <li>The Platform's open-source code is licensed under MIT. You may fork or contribute per the license.</li>
                <li>User-generated content (listings, images) remains your property, but you grant DealShield a non-exclusive license to display it on the Platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">6.</span> Disclaimer of Warranties
              </h2>
              <p>
                The Platform is provided "as is" without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, or non-infringement. DealShield does not warrant uninterrupted access or error-free operation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">7.</span> Limitation of Liability
              </h2>
              <p>
                To the fullest extent permitted by law, DealShield, its developers, contributors, and affiliates shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the Platform. Total liability shall not exceed the 0.01 SOL fee from your most recent transaction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">8.</span> Indemnification
              </h2>
              <p>
                You agree to indemnify and hold harmless DealShield and its contributors from claims arising from your use of the Platform, violations of these Terms, or third-party disputes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">9.</span> Termination
              </h2>
              <p>
                We may restrict or terminate your access if you violate these Terms. As a decentralized dApp, core functionality remains accessible via the blockchain.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">10.</span> Governing Law and Disputes
              </h2>
              <p>
                These Terms are governed by the laws of [Your Jurisdiction, e.g., Switzerland or Delaware – choose based on your setup]. Disputes shall be resolved through arbitration or on-chain mechanisms where applicable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#00d4ff]">11.</span> Changes to Terms
              </h2>
              <p>
                We may update these Terms. Continued use constitutes acceptance. Check periodically for changes.
              </p>
              <p className="mt-4 pt-4 border-t border-white/10">
                For questions, contact us via our <a href="https://X.com/dealshieldsol" target="_blank" rel="noopener noreferrer" className="text-[#00d4ff] hover:text-[#7042f8] transition-colors font-medium">X (Twitter) page</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
