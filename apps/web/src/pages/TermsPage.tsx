import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle, Shield, Scale } from 'lucide-react';

export default function TermsPage() {
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
            <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
            <p className="text-foreground-muted mb-8">Last updated: January 2025</p>

            {/* Important Notice */}
            <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl p-6 mb-8 border border-red-500/20">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h2 className="text-xl font-semibold text-foreground">Important Trading Disclaimer</h2>
              </div>
              <p className="text-foreground-muted leading-relaxed">
                Algorithmic trading involves substantial risk of loss. Past performance does not guarantee future results. 
                Only trade with funds you can afford to lose. CRYONEL provides tools and technology but does not provide 
                investment advice.
              </p>
            </div>

            {/* Key Terms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-card rounded-lg border border-border p-6">
                <Shield className="w-8 h-8 text-orange-500 mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Non-Custodial Service</h3>
                <p className="text-foreground-muted text-sm">We never hold your funds or private keys.</p>
              </div>
              
              <div className="bg-card rounded-lg border border-border p-6">
                <FileText className="w-8 h-8 text-slate-500 mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Tool Provider</h3>
                <p className="text-foreground-muted text-sm">CRYONEL provides technology, not investment advice.</p>
              </div>
              
              <div className="bg-card rounded-lg border border-border p-6">
                <Scale className="w-8 h-8 text-green-500 mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">User Responsibility</h3>
                <p className="text-foreground-muted text-sm">You are solely responsible for your trading decisions.</p>
              </div>
            </div>

            {/* Detailed Sections */}
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-foreground-muted">
                    By accessing or using the CRYONEL platform, you agree to be bound by these Terms of Service. 
                    If you disagree with any part of these terms, you may not access the service.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-foreground-muted">
                    CRYONEL is a non-custodial algorithmic trading platform that provides:
                  </p>
                  <ul className="text-foreground-muted">
                    <li>Strategy development and backtesting tools</li>
                    <li>Exchange API integration and routing</li>
                    <li>Local AI-powered market analysis</li>
                    <li>Risk management and monitoring systems</li>
                    <li>Performance tracking and reporting</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. Risk Disclosure</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <h3 className="text-lg font-medium text-foreground">Trading Risks</h3>
                  <ul className="text-foreground-muted">
                    <li>Algorithmic trading can result in substantial losses</li>
                    <li>Market volatility can exceed risk parameters</li>
                    <li>Technical failures may impact trading execution</li>
                    <li>Regulatory changes may affect trading activities</li>
                  </ul>

                  <h3 className="text-lg font-medium text-foreground mt-6">Technology Risks</h3>
                  <ul className="text-foreground-muted">
                    <li>Internet connectivity and latency issues</li>
                    <li>Exchange API limitations and downtime</li>
                    <li>Software bugs or unexpected behavior</li>
                    <li>Cybersecurity threats and attacks</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. User Responsibilities</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-foreground-muted">You are responsible for:</p>
                  <ul className="text-foreground-muted">
                    <li>Securing your account credentials and API keys</li>
                    <li>Configuring appropriate risk management settings</li>
                    <li>Monitoring your trading activities and positions</li>
                    <li>Complying with applicable laws and regulations</li>
                    <li>Maintaining adequate account funding and margin requirements</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Prohibited Activities</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <ul className="text-foreground-muted">
                    <li>Market manipulation or fraudulent trading activities</li>
                    <li>Attempting to hack, reverse engineer, or compromise the platform</li>
                    <li>Using the service for money laundering or illegal activities</li>
                    <li>Sharing account credentials with unauthorized parties</li>
                    <li>Violating exchange terms of service or regulations</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Limitation of Liability</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-foreground-muted">
                    CRYONEL SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, 
                    CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO TRADING LOSSES, 
                    LOST PROFITS, OR BUSINESS INTERRUPTION ARISING FROM YOUR USE OF THE PLATFORM.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Service Availability</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-foreground-muted">
                    While we strive for 99.9% uptime, we cannot guarantee uninterrupted service. 
                    Planned maintenance will be announced in advance. We reserve the right to suspend 
                    or terminate access for violations of these terms.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Intellectual Property</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-foreground-muted">
                    The CRYONEL platform, including software, algorithms, and documentation, 
                    is protected by intellectual property laws. You may not copy, modify, 
                    or redistribute any part of the platform without explicit permission.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Termination</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-foreground-muted">
                    You may terminate your account at any time. We may suspend or terminate 
                    your access for violations of these terms, illegal activities, or to 
                    comply with legal requirements. Upon termination, your right to use 
                    the service ceases immediately.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact Information</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-foreground-muted">
                    For questions about these terms, contact us at:
                    <br />
                    Email: legal@cryonel.com
                    <br />
                    Address: [Company Address]
                    <br />
                    Response time: Within 5 business days
                  </p>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}