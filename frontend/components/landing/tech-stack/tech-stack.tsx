"use client";

import { motion } from "framer-motion";
import { Zap, Shield, Database, Brain, Code, Blocks } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TechStack() {
  const technologies = [
    {
      name: "MetaMask Smart Accounts",
      description: "Seamless Web2-style onboarding with Web3 security. Users sign in with familiar methods while leveraging smart account capabilities.",
      icon: Shield,
      color: "primary",
      features: ["Delegation support", "Gas abstraction", "Social login"],
      category: "Account Management"
    },
    {
      name: "Monad Blockchain",
      description: "Ultra-fast, EVM-compatible blockchain delivering instant transactions and low costs for scalable credential management.",
      icon: Zap,
      color: "accent",
      features: ["1-second finality", "EVM compatible", "Low gas fees"],
      category: "Blockchain"
    },
    {
      name: "Envio Indexer",
      description: "High-performance blockchain indexing providing real-time data access for AI analysis and instant verification.",
      icon: Database,
      color: "chart-3",
      features: ["Real-time indexing", "GraphQL API", "Multi-chain support"],
      category: "Data Layer"
    },
    {
      name: "OpenAI GPT-4o",
      description: "Advanced AI model providing sophisticated fraud detection and risk analysis for credential issuance.",
      icon: Brain,
      color: "chart-4",
      features: ["Pattern recognition", "Risk assessment", "Real-time analysis"],
      category: "AI & ML"
    },
    {
      name: "Next.js 15",
      description: "Modern React framework with app router providing excellent performance and developer experience.",
      icon: Code,
      color: "chart-5",
      features: ["Server components", "App router", "Edge runtime"],
      category: "Frontend"
    },
    {
      name: "Soulbound NFTs",
      description: "Non-transferable tokens ensuring credential authenticity and preventing unauthorized transfers or sales.",
      icon: Blocks,
      color: "chart-2",
      features: ["Non-transferable", "Immutable", "Verifiable"],
      category: "Token Standard"
    }
  ];

  const integrations = [
    {
      title: "Smart Account Integration",
      description: "Privy SDK + MetaMask Smart Accounts for seamless user onboarding",
      flow: ["Social Login", "Smart Account Creation", "Gas Sponsorship", "Delegation Setup"]
    },
    {
      title: "AI-Powered Analysis",
      description: "Envio data feeding into OpenAI for comprehensive fraud detection",
      flow: ["Data Query", "Pattern Analysis", "Risk Scoring", "Report Generation"]
    },
    {
      title: "Blockchain Operations",
      description: "Delegated transactions on Monad for secure credential minting",
      flow: ["Delegation Request", "Permission Grant", "Transaction Execution", "NFT Minting"]
    }
  ];

  const architecture = [
    {
      layer: "Presentation",
      technologies: ["Next.js 15", "Tailwind CSS", "Framer Motion"],
      description: "Modern, responsive user interface"
    },
    {
      layer: "Business Logic",
      technologies: ["API Routes", "Privy Auth", "Delegation SDK"],
      description: "Core application logic and integrations"
    },
    {
      layer: "AI & Analytics",
      technologies: ["OpenAI GPT-4o", "Envio GraphQL", "Risk Engine"],
      description: "Intelligent fraud detection and analysis"
    },
    {
      layer: "Blockchain",
      technologies: ["Monad", "Smart Contracts", "Soulbound NFTs"],
      description: "Immutable credential storage and verification"
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
            Technology Stack
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Powered by <span className="text-primary">Cutting-Edge Tech</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Built on the latest Web3 infrastructure with enterprise-grade AI and blockchain technology
          </p>
        </motion.div>

        {/* Technologies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {technologies.map((tech, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-${tech.color}/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <tech.icon className={`w-6 h-6 text-${tech.color}`} />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {tech.category}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{tech.name}</h3>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                    {tech.description}
                  </p>
                  <div className="space-y-2">
                    {tech.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <div className={`w-1.5 h-1.5 bg-${tech.color} rounded-full`}></div>
                        <span className="text-xs text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Architecture Layers */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">System Architecture</h3>
            <p className="text-lg text-muted-foreground">
              Layered architecture ensuring scalability, security, and performance
            </p>
          </div>

          <div className="space-y-4">
            {architecture.map((layer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="mb-4 md:mb-0">
                        <h4 className="text-lg font-semibold text-foreground mb-2">{layer.layer} Layer</h4>
                        <p className="text-sm text-muted-foreground">{layer.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {layer.technologies.map((tech, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Integration Flows */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Key Integrations</h3>
            <p className="text-lg text-muted-foreground">
              Seamless integration between technologies for optimal user experience
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {integrations.map((integration, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-3">{integration.title}</h4>
                    <p className="text-sm text-muted-foreground mb-6">{integration.description}</p>
                    <div className="space-y-3">
                      {integration.flow.map((step, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                            {idx + 1}
                          </div>
                          <span className="text-sm text-muted-foreground">{step}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Performance Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="bg-card border rounded-2xl p-8 max-w-4xl mx-auto">
            <h4 className="text-2xl font-bold text-foreground mb-8">
              Performance at Scale
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">1s</div>
                <div className="text-sm text-muted-foreground">Transaction Finality</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">10K+</div>
                <div className="text-sm text-muted-foreground">TPS Capacity</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">∞</div>
                <div className="text-sm text-muted-foreground">Scalability</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}