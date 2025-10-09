"use client";

import { motion } from "framer-motion";
import { Shield, Github, Twitter, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const footerSections = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "#features" },
        { name: "Technology", href: "#technology" },
        { name: "Use Cases", href: "#use-cases" },
        { name: "Pricing", href: "#pricing" }
      ]
    },
    {
      title: "Developers",
      links: [
        { name: "Documentation", href: "#docs" },
        { name: "API Reference", href: "#api" },
        { name: "SDKs", href: "#sdks" },
        { name: "GitHub", href: "#github", external: true }
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "#about" },
        { name: "Blog", href: "#blog" },
        { name: "Careers", href: "#careers" },
        { name: "Contact", href: "#contact" }
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Help Center", href: "#help" },
        { name: "Community", href: "#community" },
        { name: "Status", href: "#status" },
        { name: "Privacy", href: "#privacy" }
      ]
    }
  ];

  const technologies = [
    { name: "MetaMask", href: "https://metamask.io" },
    { name: "Monad", href: "https://monad.xyz" },
    { name: "Envio", href: "https://envio.dev" },
    { name: "OpenAI", href: "https://openai.com" }
  ];

  const socialLinks = [
    { name: "GitHub", icon: Github, href: "#github" },
    { name: "Twitter", icon: Twitter, href: "#twitter" },
    { name: "Email", icon: Mail, href: "mailto:hello@vericred.plus" }
  ];

  return (
    <footer className="bg-muted/30 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">VeriCred+</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Revolutionizing digital credentials with AI-powered fraud detection, 
                seamless Web3 integration, and instant verification.
              </p>
              <div className="flex items-center space-x-3">
                {socialLinks.map((social) => (
                  <Button
                    key={social.name}
                    variant="ghost"
                    size="sm"
                    className="w-9 h-9 p-0"
                    asChild
                  >
                    <a href={social.href} target="_blank" rel="noopener noreferrer">
                      <social.icon className="w-4 h-4" />
                      <span className="sr-only">{social.name}</span>
                    </a>
                  </Button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <h3 className="text-sm font-semibold text-foreground mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center"
                    >
                      {link.name}
                      {link.external && <ExternalLink className="w-3 h-3 ml-1" />}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Technology Partners */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="text-center mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">Powered by</h3>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {technologies.map((tech) => (
                <a
                  key={tech.name}
                  href={tech.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {tech.name}
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0"
        >
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <span>&copy; 2024 VeriCred+. All rights reserved.</span>
            <a href="#privacy" className="hover:text-foreground transition-colors duration-200">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-foreground transition-colors duration-200">
              Terms of Service
            </a>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-xs text-muted-foreground flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span>Built for MetaMask x Monad x Envio Hackathon</span>
            </div>
          </div>
        </motion.div>

        {/* Newsletter Signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="bg-card border rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Stay Updated
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Get the latest updates on VeriCred+ features, integrations, and Web3 credential innovations.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button size="sm" className="whitespace-nowrap">
                Subscribe
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}