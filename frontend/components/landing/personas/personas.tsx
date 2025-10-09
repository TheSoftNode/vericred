"use client";

import { motion } from "framer-motion";
import { GraduationCap, Building2, UserCheck, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Personas() {
  const personas = [
    {
      name: "Isabella",
      role: "University Registrar",
      icon: GraduationCap,
      avatar: "👩‍💼",
      goal: "Issue digital diplomas securely and efficiently",
      frustration: "Handling verification requests is a massive time sink. Worried about issuing credentials to the wrong person.",
      color: "primary",
      stories: [
        "Sign in with Google account without managing crypto wallets",
        "See AI-powered risk assessment before issuing credentials",
        "Delegate issuance permissions to department heads"
      ],
      quote: "I need a system that prevents fraud while streamlining our credential issuance process.",
      benefits: ["Fraud prevention", "Time savings", "Easy delegation"]
    },
    {
      name: "Alex",
      role: "Recent Graduate",
      icon: UserCheck,
      avatar: "👨‍🎓",
      goal: "Share verifiable credentials with employers instantly",
      frustration: "Having to request official transcripts and wait weeks. Worried about losing paper documents.",
      color: "accent",
      stories: [
        "Access credentials from a simple interface without blockchain complexity",
        "Grant employers temporary, time-bound access to verify degrees",
        "Ensure credentials are tamper-proof and universally recognizable"
      ],
      quote: "I want instant, secure access to my credentials that employers can trust immediately.",
      benefits: ["Instant sharing", "Tamper-proof", "Universal recognition"]
    },
    {
      name: "David",
      role: "HR Manager",
      icon: Building2,
      avatar: "👨‍💼",
      goal: "Verify candidate qualifications instantly and reliably",
      frustration: "Manual validation of degrees is slow, unreliable, and prone to fraud.",
      color: "chart-3",
      stories: [
        "Enter credential ID and get immediate 'Verified' or 'Not Verified' result",
        "Request additional proof from candidates with their permission",
        "Trust the verification system completely"
      ],
      quote: "We need verification that's both instant and absolutely trustworthy for our hiring process.",
      benefits: ["Instant verification", "Complete trust", "Fraud elimination"]
    }
  ];

  const useCases = [
    {
      title: "Educational Institutions",
      description: "Universities, colleges, and schools issuing diplomas, certificates, and transcripts",
      users: "500K+ institutions"
    },
    {
      title: "Professional Certifications",
      description: "Industry bodies issuing professional licenses and certifications",
      users: "50K+ organizations"
    },
    {
      title: "Corporate Training",
      description: "Companies issuing internal training certificates and skill badges",
      users: "1M+ companies"
    },
    {
      title: "Government Credentials",
      description: "Government agencies issuing official documents and permits",
      users: "Global reach"
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
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
            User Stories
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Built for <span className="text-primary">Everyone</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            VeriCred+ serves the entire credential ecosystem with solutions tailored to each user's unique needs
          </p>
        </motion.div>

        {/* Personas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {personas.map((persona, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-8">
                  {/* Header */}
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="text-4xl">{persona.avatar}</div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{persona.name}</h3>
                      <p className="text-sm text-muted-foreground">{persona.role}</p>
                    </div>
                    <div className={`w-12 h-12 bg-${persona.color}/10 rounded-lg flex items-center justify-center ml-auto`}>
                      <persona.icon className={`w-6 h-6 text-${persona.color}`} />
                    </div>
                  </div>

                  {/* Goal */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Goal</h4>
                    <p className="text-sm text-muted-foreground">{persona.goal}</p>
                  </div>

                  {/* Frustration */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Current Frustration</h4>
                    <p className="text-sm text-muted-foreground">{persona.frustration}</p>
                  </div>

                  {/* User Stories */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-foreground mb-3">How VeriCred+ Helps</h4>
                    <div className="space-y-2">
                      {persona.stories.map((story, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <div className={`w-1.5 h-1.5 bg-${persona.color} rounded-full mt-2 flex-shrink-0`}></div>
                          <span className="text-xs text-muted-foreground leading-relaxed">{story}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quote */}
                  <div className={`bg-${persona.color}/5 rounded-lg p-4 mb-6`}>
                    <Quote className={`w-4 h-4 text-${persona.color} mb-2`} />
                    <p className="text-sm italic text-muted-foreground">{persona.quote}</p>
                  </div>

                  {/* Benefits */}
                  <div className="flex flex-wrap gap-2">
                    {persona.benefits.map((benefit, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Use Cases */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">Universal Applications</h3>
            <p className="text-lg text-muted-foreground">
              VeriCred+ adapts to any credential use case across industries and sectors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="text-center hover:shadow-lg transition-shadow duration-300 h-full">
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-3">{useCase.title}</h4>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {useCase.description}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {useCase.users}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="bg-card border rounded-2xl p-8 max-w-4xl mx-auto">
            <h4 className="text-2xl font-bold text-foreground mb-8">
              Trusted by the Credential Ecosystem
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">1.5M+</div>
                <div className="text-sm text-muted-foreground">Potential Issuers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">50M+</div>
                <div className="text-sm text-muted-foreground">Credential Holders</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">100M+</div>
                <div className="text-sm text-muted-foreground">Annual Verifications</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">$15B+</div>
                <div className="text-sm text-muted-foreground">Fraud Prevention</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}