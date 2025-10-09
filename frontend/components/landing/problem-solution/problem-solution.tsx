"use client";

import { motion } from "framer-motion";
import { Clock, FileX, DollarSign, CheckCircle, Zap, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ProblemSolution() {
  const problems = [
    {
      icon: Clock,
      title: "Manual, Slow Verification",
      description: "Traditional verification takes weeks, involves manual processes, and creates bottlenecks for institutions and employers.",
      impact: "Lost opportunities"
    },
    {
      icon: FileX,
      title: "Credential Fraud & Forgery",
      description: "Fake diplomas and certificates cost employers billions annually. Current systems can't detect sophisticated forgeries.",
      impact: "Multi-billion losses"
    },
    {
      icon: DollarSign,
      title: "Complex Web3 Onboarding",
      description: "Most credential systems require technical knowledge of crypto wallets, making adoption impossible for mainstream users.",
      impact: "User friction"
    }
  ];

  const solutions = [
    {
      icon: Zap,
      title: "AI-Powered Fraud Detection",
      description: "Advanced AI analyzes on-chain history and transaction patterns to detect fraud before credential issuance.",
      benefit: "99.9% accuracy"
    },
    {
      icon: Shield,
      title: "Seamless Smart Accounts",
      description: "Users sign in with Google while leveraging MetaMask Smart Accounts for security without complexity.",
      benefit: "Web2 UX + Web3 security"
    },
    {
      icon: CheckCircle,
      title: "Instant Verification",
      description: "Verify credentials in under 2 seconds using Envio's high-performance indexing on Monad blockchain.",
      benefit: "&lt;2s verification"
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">
            Credential Fraud is a <span className="text-accent">Multi-Billion Dollar Problem</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Traditional verification is slow, manual, and susceptible to forgery. Web3 onboarding is too complex for non-technical users.
          </p>
        </motion.div>

        {/* Problems Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-black text-foreground mb-4">Why You're Frustrated</h3>
            <p className="text-lg text-muted-foreground">
              These are the real problems you face every time you job hunt
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {problems.map((problem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-destructive/20">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <problem.icon className="w-8 h-8 text-destructive" />
                    </div>
                    <div className="text-lg font-bold text-destructive mb-3">{problem.impact}</div>
                    <h4 className="text-xl font-black text-foreground mb-4">{problem.title}</h4>
                    <p className="text-muted-foreground leading-relaxed">{problem.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Arrow Transition */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-20"
        >
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-xl">
            <svg
              className="w-10 h-10 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </motion.div>

        {/* Solutions Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-black text-foreground mb-4">How VeriCred+ Fixes This</h3>
            <p className="text-lg text-muted-foreground">
              Finally, a credential system that works for you, not against you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {solutions.map((solution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-chart-4/20 bg-chart-4/5">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-chart-4/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <solution.icon className="w-8 h-8 text-chart-4" />
                    </div>
                    <div className="text-lg font-bold text-chart-4 mb-3">{solution.benefit}</div>
                    <h4 className="text-xl font-black text-foreground mb-4">{solution.title}</h4>
                    <p className="text-muted-foreground leading-relaxed">{solution.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-20"
        >
          <div className="bg-primary/10 border-2 border-primary/20 rounded-3xl p-12 max-w-3xl mx-auto">
            <h4 className="text-3xl font-black text-foreground mb-6">
              Ready to Never Wait for Verification Again?
            </h4>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Join thousands of professionals who've taken control of their credentials. 
              Get verified instantly, share freely, and never miss another opportunity.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-chart-4 rounded-full"></div>
                <span className="font-semibold">Free to use</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="font-semibold">Works everywhere</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-accent rounded-full"></div>
                <span className="font-semibold">Setup in 2 minutes</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}