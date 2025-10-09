"use client";

import { motion } from "framer-motion";
import { Shield, Github, Twitter, Mail, ExternalLink, Sparkles } from "lucide-react";

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
    <footer className="relative bg-slate-950 border-t border-white/10">
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12">
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
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <span className="text-lg font-black text-white tracking-tight">
                  VeriCred+
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Revolutionizing digital credentials with AI-powered fraud detection,
                seamless Web3 integration, and instant verification.
              </p>
              <div className="flex items-center gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300"
                  >
                    <social.icon className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-400 transition-colors" />
                  </a>
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
              <h3 className="text-xs font-bold text-white mb-3 tracking-wide">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-xs text-slate-400 hover:text-emerald-400 transition-colors duration-200 flex items-center gap-1 group"
                    >
                      {link.name}
                      {link.external && <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

        {/* Technology Partners */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-4">
              <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Powered by</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {technologies.map((tech) => (
                <a
                  key={tech.name}
                  href={tech.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 hover:text-white transition-colors duration-200 font-medium"
                >
                  {tech.name}
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

        {/* Bottom Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-500">
            <span>&copy; 2024 VeriCred+. All rights reserved.</span>
            <a href="#privacy" className="hover:text-emerald-400 transition-colors duration-200">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-emerald-400 transition-colors duration-200">
              Terms of Service
            </a>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span>Built for MetaMask x Monad x Envio Hackathon</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}