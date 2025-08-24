import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie, Settings, Shield, Eye } from 'lucide-react';

export default function CookiesPage() {
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
            <h1 className="text-4xl font-bold text-foreground mb-4">Cookie Policy</h1>
            <p className="text-foreground-muted mb-8">Last updated: January 2025</p>

            {/* Introduction */}
            <div className="bg-gradient-to-br from-blue-500/5 to-slate-500/5 rounded-xl p-6 mb-8 border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <Cookie className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-foreground">Minimal Cookie Usage</h2>
              </div>
              <p className="text-foreground-muted leading-relaxed">
                CRYONEL uses minimal cookies to provide essential functionality. We prioritize your privacy 
                and only use cookies that are necessary for the platform to work properly.
              </p>
            </div>

            {/* Cookie Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-card rounded-lg border border-border p-6">
                <Shield className="w-8 h-8 text-green-500 mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Essential Cookies</h3>
                <p className="text-foreground-muted text-sm">Required for authentication and security. Cannot be disabled.</p>
              </div>
              
              <div className="bg-card rounded-lg border border-border p-6">
                <Settings className="w-8 h-8 text-slate-500 mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Functional Cookies</h3>
                <p className="text-foreground-muted text-sm">Remember your preferences and settings. Optional.</p>
              </div>
              
              <div className="bg-card rounded-lg border border-border p-6">
                <Eye className="w-8 h-8 text-orange-500 mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Analytics Cookies</h3>
                <p className="text-foreground-muted text-sm">Anonymous usage statistics to improve the platform. Optional.</p>
              </div>
              
              <div className="bg-card rounded-lg border border-border p-6 opacity-50">
                <Cookie className="w-8 h-8 text-gray-400 mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Advertising Cookies</h3>
                <p className="text-foreground-muted text-sm">We do not use advertising cookies or tracking.</p>
              </div>
            </div>

            {/* Detailed Sections */}
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">What Are Cookies?</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-foreground-muted">
                    Cookies are small text files stored on your device when you visit a website. They help websites 
                    remember information about your visit, making your experience more personalized and efficient.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Cookies We Use</h2>
                
                <div className="space-y-6">
                  <div className="border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-500" />
                      Essential Cookies
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 text-foreground">Cookie Name</th>
                            <th className="text-left py-2 text-foreground">Purpose</th>
                            <th className="text-left py-2 text-foreground">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="text-foreground-muted">
                          <tr className="border-b border-border/50">
                            <td className="py-2 font-mono">auth_token</td>
                            <td className="py-2">User authentication and session management</td>
                            <td className="py-2">7 days</td>
                          </tr>
                          <tr className="border-b border-border/50">
                            <td className="py-2 font-mono">csrf_token</td>
                            <td className="py-2">Security protection against cross-site attacks</td>
                            <td className="py-2">Session</td>
                          </tr>
                          <tr className="border-b border-border/50">
                            <td className="py-2 font-mono">session_id</td>
                            <td className="py-2">Maintain your logged-in state</td>
                            <td className="py-2">Session</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-slate-500" />
                      Functional Cookies
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 text-foreground">Cookie Name</th>
                            <th className="text-left py-2 text-foreground">Purpose</th>
                            <th className="text-left py-2 text-foreground">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="text-foreground-muted">
                          <tr className="border-b border-border/50">
                            <td className="py-2 font-mono">theme_preference</td>
                            <td className="py-2">Remember your dark/light mode preference</td>
                            <td className="py-2">1 year</td>
                          </tr>
                          <tr className="border-b border-border/50">
                            <td className="py-2 font-mono">language_preference</td>
                            <td className="py-2">Remember your language selection</td>
                            <td className="py-2">1 year</td>
                          </tr>
                          <tr className="border-b border-border/50">
                            <td className="py-2 font-mono">dashboard_layout</td>
                            <td className="py-2">Save your dashboard customizations</td>
                            <td className="py-2">6 months</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-orange-500" />
                      Analytics Cookies (Optional)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 text-foreground">Cookie Name</th>
                            <th className="text-left py-2 text-foreground">Purpose</th>
                            <th className="text-left py-2 text-foreground">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="text-foreground-muted">
                          <tr className="border-b border-border/50">
                            <td className="py-2 font-mono">analytics_session</td>
                            <td className="py-2">Anonymous usage statistics (no personal data)</td>
                            <td className="py-2">30 minutes</td>
                          </tr>
                          <tr className="border-b border-border/50">
                            <td className="py-2 font-mono">performance_metrics</td>
                            <td className="py-2">Platform performance monitoring</td>
                            <td className="py-2">1 day</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Managing Your Cookie Preferences</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <h3 className="text-lg font-medium text-foreground">Browser Settings</h3>
                  <p className="text-foreground-muted">
                    You can control cookies through your browser settings. Most browsers allow you to:
                  </p>
                  <ul className="text-foreground-muted">
                    <li>View and delete cookies</li>
                    <li>Block cookies from specific websites</li>
                    <li>Set preferences for cookie acceptance</li>
                    <li>Be notified when cookies are being used</li>
                  </ul>

                  <h3 className="text-lg font-medium text-foreground mt-6">CRYONEL Settings</h3>
                  <p className="text-foreground-muted">
                    When logged in, you can manage cookie preferences from your account settings:
                  </p>
                  <ul className="text-foreground-muted">
                    <li>Toggle analytics cookies on/off</li>
                    <li>Clear stored preferences</li>
                    <li>View active cookies and their purposes</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Third-Party Cookies</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-foreground-muted">
                    CRYONEL does not use third-party advertising cookies or tracking pixels. 
                    The only third-party cookies may come from:
                  </p>
                  <ul className="text-foreground-muted">
                    <li>OAuth providers (Google, GitHub) during authentication</li>
                    <li>CDN services for faster content delivery</li>
                    <li>Security services for DDoS protection</li>
                  </ul>
                  <p className="text-foreground-muted">
                    These are minimal and necessary for platform functionality.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Data Protection</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-foreground-muted">
                    Cookie data is encrypted and stored securely. We implement the same security 
                    standards for cookies as we do for all user data. Cookies are transmitted 
                    over secure HTTPS connections only.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <p className="text-foreground-muted">
                    For questions about our cookie policy, contact us at:
                    <br />
                    Email: privacy@cryonel.com
                    <br />
                    Subject: Cookie Policy Inquiry
                    <br />
                    Response time: Within 48 hours
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