"use client";

import { 
  Wallet, 
  Tag, 
  Search, 
  Truck, 
  ShieldCheck, 
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    id: 1,
    title: "Sign Up – Easy!",
    description: "Connect your Solana wallet (like Phantom or Backpack). No email or password needed.",
    icon: Wallet,
    color: "text-[#00d4ff]",
    bg: "bg-[#00d4ff]/10"
  },
  {
    id: 2,
    title: "Sell Something",
    description: "Make a listing: Add photos, name, description, price, and shipping info. It's free to list!",
    icon: Tag,
    color: "text-[#7042f8]",
    bg: "bg-[#7042f8]/10"
  },
  {
    id: 3,
    title: "Buy Something",
    description: "Look for items you like. Choose to pay with SOL. When you buy, your money + a small 0.01 SOL fee goes into a safe 'escrow' box on the blockchain. No one can touch it yet – not even DealShield!",
    icon: Search,
    color: "text-[#ab42f8]",
    bg: "bg-[#ab42f8]/10"
  },
  {
    id: 4,
    title: "Seller Sends the Item",
    description: "The seller ships your item (or sends digital file).",
    icon: Truck,
    color: "text-[#00d4ff]",
    bg: "bg-[#00d4ff]/10"
  },
  {
    id: 5,
    title: "You Get the Item",
    description: "When it arrives and everything is good: Press the 'Confirm' button in the app. Money is automatically sent to the seller. The 0.01 SOL fee helps keep the platform running.",
    icon: CheckCircle2,
    color: "text-[#7042f8]",
    bg: "bg-[#7042f8]/10"
  },
  {
    id: 6,
    title: "If Something Goes Wrong",
    description: "If you don’t confirm in 14 days, money comes back to you automatically (minus the fee). If there’s a problem, the community can help decide what’s fair.",
    icon: AlertTriangle,
    color: "text-[#ff4242]",
    bg: "bg-[#ff4242]/10"
  }
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen pb-20 overflow-hidden bg-[#030014]">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#7042f8]/10 rounded-full blur-[100px] -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00d4ff]/10 rounded-full blur-[100px] -ml-20 -mb-20"></div>
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        {/* Header Section */}
        <section className="pt-32 pb-16 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#00d4ff] text-sm font-medium mb-8">
              <ShieldCheck className="w-4 h-4" />
              <span>Simple Explanation</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">
              How DealShield Works
            </h1>
            
            <p className="text-xl text-gray-300 leading-relaxed">
              DealShield is a safe online marketplace on the Solana blockchain. You can buy and sell things (like toys, clothes, gadgets, art, or digital items) without worrying about scams. Money is kept safe until you get your item.
            </p>
          </motion.div>
        </section>

        {/* Steps Grid */}
        <section className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 rounded-3xl -z-10 group-hover:from-white/10 transition-colors duration-300"></div>
                <div className="h-full p-8 rounded-3xl border border-white/10 bg-black/20 backdrop-blur-sm hover:border-white/20 transition-all duration-300 flex flex-col">
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center`}>
                      <step.icon className={`w-6 h-6 ${step.color}`} />
                    </div>
                    <span className="text-4xl font-bold text-white/5 group-hover:text-white/10 transition-colors">
                      0{step.id}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-[#00d4ff] transition-colors">
                    {step.title}
                  </h3>
                  
                  <p className="text-gray-400 leading-relaxed text-sm flex-grow">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Closing Section */}
        <section className="py-20 text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-gradient-to-br from-[#7042f8]/20 to-[#00d4ff]/20 border border-white/10 backdrop-blur-md"
          >
            <h3 className="text-2xl font-bold text-white mb-6">Safe & Secure</h3>
            <p className="text-gray-300 mb-8 leading-relaxed">
              DealShield keeps your money safe using smart code on the blockchain. No big company holds your money – the code does it automatically. It’s fast, cheap, and fair for everyone – buyers and sellers.
            </p>
            <div className="text-[#00d4ff] font-bold text-lg flex items-center justify-center gap-2">
              Start buying or selling safely today! 
              <span className="text-2xl">🛡️</span>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
