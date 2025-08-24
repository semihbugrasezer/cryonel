import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Target, Users, Shield, Zap } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500/10 to-slate-500/10 rounded-lg flex items-center justify-center mr-3 shadow-md">
                <img 
                  src="/cryonel_logo_cube.svg" 
                  alt="CRYONEL 3D Logo" 
                  className="w-8 h-8" 
                />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-orange-500 bg-clip-text text-transparent">
                CRYONEL
              </h1>
            </div>
            <Link
              to="/"
              className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
                About CRYONEL
              </h1>
              <p className="text-xl text-foreground-muted max-w-3xl mx-auto leading-relaxed">
                We're building the future of algorithmic trading with privacy, transparency, 
                and performance at the core of everything we do.
              </p>
            </div>

            {/* Mission Statement */}
            <section className="mb-16">
              <div className="bg-gradient-to-br from-orange-500/5 to-slate-500/5 rounded-xl p-8 border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-orange-500" />
                  <h2 className="text-2xl font-semibold text-foreground">Our Mission</h2>
                </div>
                <p className="text-foreground-muted leading-relaxed text-lg">
                  To democratize sophisticated trading technology while maintaining the highest standards 
                  of security and transparency. We believe every trader should have access to institutional-grade 
                  tools without compromising their privacy or security.
                </p>
              </div>
            </section>

            {/* Core Values */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Our Core Values</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Security First</h3>
                  <p className="text-foreground-muted text-sm">Non-custodial architecture with end-to-end encryption</p>
                </div>
                
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <Users className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Community Driven</h3>
                  <p className="text-foreground-muted text-sm">Built with and for the trading community</p>
                </div>
                
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <Zap className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Performance</h3>
                  <p className="text-foreground-muted text-sm">Sub-50ms execution with advanced routing</p>
                </div>
                
                <div className="bg-card border border-border rounded-xl p-6 text-center">
                  <Target className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Innovation</h3>
                  <p className="text-foreground-muted text-sm">Cutting-edge AI and blockchain technology</p>
                </div>
              </div>
            </section>

            {/* Story */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-8">Our Story</h2>
              
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-foreground-muted text-lg leading-relaxed mb-6">
                  CRYONEL was born from a simple observation: the best trading technology was locked away 
                  in proprietary systems, accessible only to large institutions. Meanwhile, retail traders 
                  were forced to choose between powerful tools that required surrendering control of their funds, 
                  or maintaining custody while accepting inferior technology.
                </p>
                
                <p className="text-foreground-muted text-lg leading-relaxed mb-6">
                  We set out to solve this fundamental trade-off. By leveraging advances in client-side encryption, 
                  local AI processing, and decentralized architecture, we created a platform that offers 
                  institutional-grade capabilities while keeping users in complete control of their assets.
                </p>
                
                <p className="text-foreground-muted text-lg leading-relaxed">
                  Today, CRYONEL serves traders worldwide, processing millions in volume while maintaining 
                  our commitment to transparency, security, and user empowerment. Every line of code, every 
                  architectural decision, and every feature is designed with one goal: giving you the best 
                  possible trading tools without compromise.
                </p>
              </div>
            </section>

            {/* Team */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Built by Experts</h2>
              
              <div className="bg-card border border-border rounded-xl p-8">
                <p className="text-foreground-muted text-lg leading-relaxed text-center">
                  Our team brings together decades of experience from top trading firms, fintech companies, 
                  and blockchain projects. We're united by a shared belief that technology should empower 
                  users, not control them.
                </p>
                
                <div className="mt-8 text-center">
                  <Link
                    to="/careers"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                  >
                    Join Our Team
                  </Link>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Get in Touch</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">General Inquiries</h3>
                  <p className="text-foreground-muted mb-4">
                    Have questions about CRYONEL? Want to learn more about our platform?
                  </p>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
                  >
                    Contact Us
                  </Link>
                </div>
                
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Security Issues</h3>
                  <p className="text-foreground-muted mb-4">
                    Found a security vulnerability? We take security seriously and appreciate responsible disclosure.
                  </p>
                  <a
                    href="mailto:security@cryonel.com"
                    className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
                  >
                    security@cryonel.com
                  </a>
                </div>
              </div>
            </section>
          </motion.div>
        </div>
      </main>
    </div>
  );
}