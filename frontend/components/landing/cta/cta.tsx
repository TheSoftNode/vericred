"use client";

import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Users, CheckCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CTA() {
  const benefits = [
    "Deploy in minutes, not months",
    "99.9% fraud detection accuracy",
    "Instant verification globally",
    "Enterprise-grade security"
  ];

  const ctaOptions = [
    {
      title: "Start Building",
      description: "Get started with VeriCred+ and issue your first credential",
      icon: Shield,
      color: "primary",
      action: "Get Started Free",
      features: ["Free tier available", "Full documentation", "24/7 support"]
    },
    {
      title: "Watch Demo",
      description: "See VeriCred+ in action with our comprehensive demo",
      icon: Play,
      color: "accent",
      action: "Watch Demo",
      features: ["3-minute overview", "Live examples", "Technical deep-dive"]
    },
    {
      title: "Enterprise",
      description: "Custom solutions for large-scale credential management",
      icon: Users,
      color: "chart-3",
      action: "Contact Sales",
      features: ["Custom integration", "Dedicated support", "SLA guarantees"]
    }
  ];

  const stats = [
    { value: "15s", label: "Setup Time" },
    { value: "<2s", label: "Verification" },
    { value: "99.9%", label: "Fraud Detection" },
    { value: "∞", label: "Scale" }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4">
            Ready to Start?
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Transform Your
            <span className="text-primary block">Credential System</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Join the future of secure, instant, and tamper-proof credential management. 
            Start building with VeriCred+ today.
          </p>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-6 mb-8"
          >
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </motion.div>

          {/* Primary CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
          >
            <Button size="lg" className="px-8 py-4 text-lg font-semibold group">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </motion.div>
        </motion.div>

        {/* CTA Options */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {ctaOptions.map((option, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 group cursor-pointer">
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 bg-${option.color}/10 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <option.icon className={`w-8 h-8 text-${option.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">{option.title}</h3>
                  <p className="text-muted-foreground mb-6">{option.description}</p>
                  
                  <div className="space-y-2 mb-8">
                    {option.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center justify-center space-x-2">
                        <div className={`w-1.5 h-1.5 bg-${option.color} rounded-full`}></div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className={`w-full ${option.color === 'primary' ? '' : 'variant-outline'}`}
                    variant={option.color === 'primary' ? 'default' : 'outline'}
                  >
                    {option.action}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-card border rounded-2xl p-8 mb-16"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Final Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <div className="bg-primary/5 border-2 border-primary/20 rounded-3xl p-12 max-w-4xl mx-auto">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="w-10 h-10 text-primary-foreground" />
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Ready to Revolutionize Credentials?
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of institutions already using VeriCred+ to issue and verify 
              credentials securely and instantly. The future of digital credentials starts now.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
              <Button size="lg" className="px-10 py-4 text-lg font-semibold">
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                Schedule Demo
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Free tier forever</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
                <span>Deploy in minutes</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Hackathon Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center space-x-3 bg-card border rounded-full px-6 py-3">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-foreground">
              Built for MetaMask x Monad x Envio Hackathon
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}