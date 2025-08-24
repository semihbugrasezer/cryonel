import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Server } from 'lucide-react';

export default function PrivacyPage() {
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
            <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
            <p className="text-foreground-muted mb-8">Last updated: January 2025</p>

            {/* Introduction */}
            <div className="bg-gradient-to-br from-orange-500/5 to-slate-500/5 rounded-xl p-6 mb-8 border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-semibold text-foreground">Privacy-First by Design</h2>
              </div>
              <p className="text-foreground-muted leading-relaxed">
                At CRYONEL, we believe privacy is a fundamental right. Our platform is designed with privacy-first principles, 
                ensuring your trading data, API keys, and personal information remain secure and under your control.
              </p>
            </div>

            {/* Key Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-card rounded-lg border border-border p-6">
                <Lock className="w-8 h-8 text-orange-500 mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">End-to-End Encryption</h3>
                <p className="text-foreground-muted text-sm">All API keys are encrypted client-side using AES-GCM before transmission.</p>
              </div>
              
              <div className="bg-card rounded-lg border border-border p-6">
                <Eye className="w-8 h-8 text-slate-500 mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Zero Knowledge</h3>
                <p className="text-foreground-muted text-sm">We cannot access your decrypted API keys or trading strategies.</p>
              </div>
              
              <div className="bg-card rounded-lg border border-border p-6">
                <Server className="w-8 h-8 text-green-500 mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Local AI Processing</h3>
                <p className="text-foreground-muted text-sm">AI analysis runs on your device - no data sent to external AI services.</p>
              </div>
              
              <div className="bg-card rounded-lg border border-border p-6">
                <Shield className="w-8 h-8 text-blue-500 mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Non-Custodial</h3>
                <p className="text-foreground-muted text-sm">We never hold your funds or have access to your exchange accounts.</p>
              </div>
            </div>

            {/* Detailed Sections */}
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Information We Collect</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <h3 className="text-lg font-medium text-foreground">Account Information</h3>
                  <ul className="text-foreground-muted">
                    <li>Email address (for authentication and communication)</li>
                    <li>Username and display preferences</li>
                    <li>OAuth tokens (encrypted and stored securely)</li>
                  </ul>

                  <h3 className="text-lg font-medium text-foreground mt-6">Trading Data</h3>
                  <ul className="text-foreground-muted">
                    <li>Strategy configurations (encrypted client-side)</li>
                    <li>Performance metrics and PnL calculations</li>
                    <li>Risk management settings</li>
                  </ul>

                  <h3 className="text-lg font-medium text-foreground mt-6">Technical Information</h3>
                  <ul className="text-foreground-muted">
                    <li>Browser type and version</li>
                    <li>IP address (for security and fraud prevention)</li>
                    <li>Usage analytics (anonymized)</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">How We Use Your Information</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <ul className="text-foreground-muted">
                    <li>Provide and maintain the CRYONEL trading platform</li>
                    <li>Process and execute your trading strategies</li>
                    <li>Send important security and service notifications</li>
                    <li>Improve platform performance and user experience</li>
                    <li>Comply with legal obligations and prevent fraud</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Data Security</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-foreground-muted">
                    We implement industry-leading security measures including AES-256 encryption, 
                    tamper-evident logging, and regular security audits. Your API keys are encrypted 
                    using your password-derived key, ensuring only you can decrypt them.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Third-Party Services</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-foreground-muted">
                    We use minimal third-party services and only share necessary data. OAuth providers 
                    (Google, GitHub) receive only basic profile information. We do not sell or share 
                    your personal information with advertisers or data brokers.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Your Rights</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <ul className="text-foreground-muted">
                    <li>Access your personal data</li>
                    <li>Correct inaccurate information</li>
                    <li>Delete your account and associated data</li>
                    <li>Export your trading data</li>
                    <li>Withdraw consent for data processing</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-foreground-muted">
                    For privacy-related questions or to exercise your rights, contact us at:
                    <br />
                    Email: privacy@cryonel.com
                    <br />
                    Response time: Within 72 hours
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