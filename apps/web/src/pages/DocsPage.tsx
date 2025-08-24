import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Book, Code, Zap, Shield, Settings, Database, ArrowRight } from 'lucide-react';

interface DocCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  category: string;
}

function DocCard({ icon, title, description, href, category }: DocCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-card border border-border rounded-xl p-6 hover:border-orange-500/30 transition-all duration-300 group"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500/10 to-slate-500/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-xs text-orange-500 font-medium mb-1">{category}</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-foreground-muted text-sm leading-relaxed mb-4">{description}</p>
          <Link
            to={href}
            className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 text-sm font-medium transition-colors"
          >
            Read more
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function DocsPage() {
  const quickStartDocs = [
    {
      icon: <Zap className="w-5 h-5 text-orange-500" />,
      title: "Getting Started",
      description: "Set up your CRYONEL account and connect your first exchange API in under 5 minutes.",
      href: "/docs/getting-started",
      category: "QUICKSTART"
    },
    {
      icon: <Shield className="w-5 h-5 text-green-500" />,
      title: "API Key Security",
      description: "Learn how to securely configure API keys with proper permissions and encryption.",
      href: "/docs/api-security",
      category: "SECURITY"
    },
    {
      icon: <Code className="w-5 h-5 text-blue-500" />,
      title: "First Strategy",
      description: "Create and deploy your first algorithmic trading strategy with our visual builder.",
      href: "/docs/first-strategy",
      category: "TUTORIAL"
    }
  ];

  const advancedDocs = [
    {
      icon: <Database className="w-5 h-5 text-purple-500" />,
      title: "Strategy Development",
      description: "Advanced strategy creation, backtesting, and optimization techniques.",
      href: "/docs/strategy-development",
      category: "ADVANCED"
    },
    {
      icon: <Settings className="w-5 h-5 text-slate-500" />,
      title: "Risk Management",
      description: "Configure position limits, stop-losses, and automated risk controls.",
      href: "/docs/risk-management",
      category: "CONFIGURATION"
    },
    {
      icon: <Code className="w-5 h-5 text-indigo-500" />,
      title: "API Reference",
      description: "Complete API documentation with examples and integration guides.",
      href: "/docs/api-reference",
      category: "REFERENCE"
    }
  ];

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
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Book className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                Documentation
              </h1>
              <p className="text-xl text-foreground-muted max-w-3xl mx-auto leading-relaxed">
                Everything you need to know to master algorithmic trading with CRYONEL. 
                From quick setup guides to advanced strategy development.
              </p>
            </div>

            {/* Search Bar */}
            <div className="mb-12">
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search documentation..."
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 pl-12 text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50"
                  />
                  <Book className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                </div>
              </div>
            </div>

            {/* Quick Start Section */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold text-foreground mb-2">Quick Start</h2>
              <p className="text-foreground-muted mb-8">Get up and running with CRYONEL in minutes</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {quickStartDocs.map((doc, index) => (
                  <DocCard key={index} {...doc} />
                ))}
              </div>
            </section>

            {/* Advanced Topics */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold text-foreground mb-2">Advanced Topics</h2>
              <p className="text-foreground-muted mb-8">Deep dive into advanced features and configurations</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {advancedDocs.map((doc, index) => (
                  <DocCard key={index} {...doc} />
                ))}
              </div>
            </section>

            {/* Categories Grid */}
            <section className="mb-16">
              <h2 className="text-2xl font-bold text-foreground mb-8">Browse by Category</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card border border-border rounded-xl p-6 text-center hover:border-orange-500/30 transition-all duration-300">
                  <Zap className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Tutorials</h3>
                  <p className="text-foreground-muted text-sm">Step-by-step guides</p>
                </div>
                
                <div className="bg-card border border-border rounded-xl p-6 text-center hover:border-orange-500/30 transition-all duration-300">
                  <Code className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">API Reference</h3>
                  <p className="text-foreground-muted text-sm">Complete API docs</p>
                </div>
                
                <div className="bg-card border border-border rounded-xl p-6 text-center hover:border-orange-500/30 transition-all duration-300">
                  <Shield className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Security</h3>
                  <p className="text-foreground-muted text-sm">Best practices</p>
                </div>
                
                <div className="bg-card border border-border rounded-xl p-6 text-center hover:border-orange-500/30 transition-all duration-300">
                  <Settings className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Configuration</h3>
                  <p className="text-foreground-muted text-sm">Setup guides</p>
                </div>
              </div>
            </section>

            {/* Support Section */}
            <section className="bg-gradient-to-br from-orange-500/5 to-slate-500/5 rounded-xl p-8 border border-border/50">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-4">Need Help?</h2>
                <p className="text-foreground-muted mb-6 max-w-2xl mx-auto">
                  Can't find what you're looking for? Our support team is here to help you get the most out of CRYONEL.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/support"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 inline-flex items-center justify-center gap-2"
                  >
                    Contact Support
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/community"
                    className="bg-background border border-border hover:border-orange-500/30 text-foreground px-6 py-3 rounded-lg font-semibold transition-all duration-300 inline-flex items-center justify-center gap-2"
                  >
                    Join Community
                  </Link>
                </div>
              </div>
            </section>
          </motion.div>
        </div>
      </main>
    </div>
  );
}