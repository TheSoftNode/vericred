"use client";

import { motion } from "framer-motion";
import { Brain, Users, Shield, Zap, Clock, Key } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Features() {
  const mainFeatures = [
    {
      icon: Brain,
      title: "AI-Powered Fraud Detection",
      description: "Advanced AI agents analyze on-chain history and transaction patterns to detect potential fraud before credential issuance.",
      benefits: ["99.9% accuracy", "Real-time analysis", "Pattern recognition"],
      color: "accent"
    },
    {
      icon: Users,
      title: "Delegated Smart Account Management",
      description: "Seamlessly delegate credential issuance permissions using MetaMask Smart Accounts with time-bounded controls.",
      benefits: ["Permission delegation", "Time-bounded access", "Smart account security"],
      color: "primary"
    },
    {
      icon: Shield,
      title: "Soulbound NFT Credentials",
      description: "Issue tamper-proof credentials as Soulbound NFTs that cannot be transferred, ensuring authenticity and ownership.",
      benefits: ["Non-transferable", "Immutable records", "Blockchain verified"],
      color: "chart-3"
    }
  ];

  const additionalFeatures = [
    {
      icon: Zap,
      title: "Instant Verification",
      description: "Verify credentials in under 2 seconds using Envio's high-performance indexing.",
      stat: "<2s"
    },
    {
      icon: Clock,
      title: "Time-Bounded Access",
      description: "Grant temporary verification access with automatic expiration for enhanced security.",
      stat: "Automated"
    },
    {
      icon: Key,
      title: "Frictionless Onboarding",
      description: "Sign in with familiar Web2 methods while leveraging Web3 security under the hood.",
      stat: "15s Setup"
    }
  ];

  const flowSteps = [
    {
      step: "01",
      title: "Issue Request",
      description: "Issuer enters recipient details and credential information"
    },
    {
      step: "02",
      title: "AI Analysis",
      description: "AI agent queries Envio indexer and analyzes on-chain history"
    },
    {
      step: "03",
      title: "Risk Assessment",
      description: "OpenAI GPT-4o generates comprehensive fraud risk report"
    },
    {
      step: "04",
      title: "Delegation",
      description: "MetaMask delegation request for secure credential minting"
    },
    {
      step: "05",
      title: "Blockchain Mint",
      description: "Soulbound NFT credential minted on Monad blockchain"
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
          <Badge variant="outline" className="mb-4">
            Core Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Next-Generation <span className="text-primary">Credential Technology</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Powered by cutting-edge AI, blockchain technology, and seamless user experience design
          </p>
        </motion.div>

        {/* Main Features */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className={`w-16 h-16 bg-${feature.color}/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-8 h-8 text-${feature.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="space-y-2">
                    {feature.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <div className={`w-2 h-2 bg-${feature.color} rounded-full`}></div>
                        <span className="text-sm text-muted-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Process Flow */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">How It Works</h3>
            <p className="text-lg text-muted-foreground">
              Our streamlined process ensures security, efficiency, and user experience
            </p>
          </div>

          <div className="relative">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-8 lg:space-y-0 lg:space-x-4">
              {flowSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative flex-1 max-w-xs"
                >
                  <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold">
                        {step.step}
                      </div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                  
                  {/* Arrow */}
                  {index < flowSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2">
                      <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Additional Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {additionalFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-secondary rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-primary mb-2">{feature.stat}</div>
                  <h4 className="text-lg font-semibold text-foreground mb-3">{feature.title}</h4>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}