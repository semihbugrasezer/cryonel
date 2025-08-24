import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { animationUtils } from '../utils/animations';
import { useAuthStore } from '../stores/authStore';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { Shield, Zap, Brain, TrendingUp, BarChart3, Lock } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="relative group"
    >
      <div className="glass border border-border rounded-2xl p-4 sm:p-6 lg:p-8 transition-all duration-500 hover:scale-105 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 h-full">
        <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-slate-700 to-orange-500 rounded-xl flex items-center justify-center mb-3 sm:mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground mb-2 lg:mb-3">{title}</h3>
        <p className="text-foreground-muted leading-relaxed text-xs sm:text-sm lg:text-base">{description}</p>
      </div>
    </motion.div>
  );
}

interface StatsCardProps {
  number: string;
  label: string;
  delay: number;
}

function StatsCard({ number, label, delay }: StatsCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView && numberRef.current) {
      // Enhanced animation for the number
      animationUtils.animatedCounter(numberRef.current, 150, 1200, delay * 1000);
    }
  }, [isInView, delay]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay }}
      className="text-center group p-2 sm:p-0"
    >
      <div 
        ref={numberRef}
        className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-500 to-slate-600 bg-clip-text text-transparent mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-300"
        style={{ opacity: 0 }}
      >
        {number}
      </div>
      <div className="text-xs sm:text-sm md:text-base text-foreground-muted group-hover:text-foreground transition-colors duration-300 leading-tight">{label}</div>
    </motion.div>
  );
}

export default function LandingPage() {
  const { isAuthenticated, login: storeLogin } = useAuthStore();
  const heroRef = useRef(null);
  const scope = useRef(null);
  const floatingElementsRef = useRef<HTMLDivElement[]>([]);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const featuresRef = useRef<HTMLDivElement[]>([]);
  const parallaxElementsRef = useRef<HTMLDivElement[]>([]);


  useEffect(() => {
    // Enhanced floating elements animation
    const floatingAnimation = () => {
      floatingElementsRef.current.forEach((el, index) => {
        if (el) {
          animationUtils.float(el, {
            delay: index * 200,
            translateY: [-20 + (index * 5), 20 + (index * 5), -20 + (index * 5)],
            translateX: [-8 + (index * 3), 8 + (index * 3), -8 + (index * 3)],
            rotate: [-3 + index, 3 + index, -3 + index]
          });
        }
      });
    };

    // Hero text animations
    const heroAnimations = () => {
      if (heroTitleRef.current) {
        animationUtils.heroTextReveal(heroTitleRef.current, 200);
      }
      if (heroSubtitleRef.current) {
        animationUtils.heroTextReveal(heroSubtitleRef.current, 600);
      }
    };

    // Parallax effect setup
    const parallaxCleanup = animationUtils.parallaxScroll(parallaxElementsRef.current, 0.3);

    // Start animations
    const timer = setTimeout(() => {
      floatingAnimation();
      heroAnimations();
    }, 500);
    
    return () => {
      clearTimeout(timer);
      if (parallaxCleanup) parallaxCleanup();
    };
  }, []);

  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !floatingElementsRef.current.includes(el)) {
      floatingElementsRef.current.push(el);
    }
  };

  const addToParallaxRefs = (el: HTMLDivElement | null) => {
    if (el && !parallaxElementsRef.current.includes(el)) {
      parallaxElementsRef.current.push(el);
    }
  };

  const addToFeaturesRefs = (el: HTMLDivElement | null) => {
    if (el && !featuresRef.current.includes(el)) {
      featuresRef.current.push(el);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface-primary to-surface-secondary relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          ref={addToRefs}
          className="absolute top-20 left-10 w-2 h-2 bg-amber-500 rounded-full opacity-60"
        />
        <div 
          ref={addToRefs}
          className="absolute top-40 right-20 w-1 h-1 bg-green-600 rounded-full opacity-80"
        />
        <div 
          ref={addToRefs}
          className="absolute bottom-40 left-20 w-3 h-3 bg-slate-500 rounded-full opacity-40"
        />
        <div 
          ref={addToRefs}
          className="absolute bottom-60 right-10 w-2 h-2 bg-amber-500 rounded-full opacity-70"
        />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-50 bg-background/80 backdrop-blur-xl border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-6">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500/10 to-slate-500/10 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shadow-md">
                <img 
                  src="/cryonel_logo_cube.svg" 
                  alt="CRYONEL 3D Logo" 
                  className="w-6 h-6 sm:w-8 sm:h-8" 
                />
              </div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-slate-700 to-orange-500 bg-clip-text text-transparent">
                CRYONEL
              </h1>
            </div>
            <nav className="flex items-center space-x-1 sm:space-x-2 lg:space-x-6">
              <ThemeToggle />
              
              {/* Mobile Navigation */}
              <div className="flex md:hidden items-center space-x-1">
                <button 
                  onClick={() => {
                    const featuresSection = document.getElementById('features');
                    featuresSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="text-foreground-muted hover:text-foreground transition-all duration-300 text-xs px-2 py-1 rounded"
                >
                  Features
                </button>
                <button 
                  onClick={() => {
                    const statsSection = document.getElementById('stats');
                    statsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="text-foreground-muted hover:text-foreground transition-all duration-300 text-xs px-2 py-1 rounded"
                >
                  Stats
                </button>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
                <div className="nav-link-wrapper">
                  <button 
                    onClick={() => {
                      const featuresSection = document.getElementById('features');
                      featuresSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-foreground-muted hover:text-foreground transition-all duration-300 relative group nav-link hover:scale-105"
                  >
                    Features
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-slate-700 to-orange-500 transition-all duration-300 group-hover:w-full"></span>
                  </button>
                </div>
                <div className="nav-link-wrapper">
                  <button 
                    onClick={() => {
                      const statsSection = document.getElementById('stats');
                      statsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="text-foreground-muted hover:text-foreground transition-all duration-300 relative group nav-link hover:scale-105"
                  >
                    Stats
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-slate-700 to-orange-500 transition-all duration-300 group-hover:w-full"></span>
                  </button>
                </div>
              </div>
              
              {/* Auth Buttons */}
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2 rounded-lg transition-all duration-300 hover:scale-105 text-xs sm:text-sm lg:text-base"
                >
                  <span className="hidden sm:inline">Go to Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                </Link>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
                  <Link
                    to="/auth"
                    className="text-foreground-muted hover:text-foreground transition-colors text-xs sm:text-sm lg:text-base hidden sm:block"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth?mode=register"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-2 sm:px-3 lg:px-6 py-1.5 sm:py-2 rounded-lg transition-all duration-300 hover:scale-105 text-xs sm:text-sm lg:text-base"
                  >
                    <span className="hidden sm:inline">Get Started</span>
                    <span className="sm:hidden">Start</span>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative py-12 sm:py-16 md:py-24 lg:py-32 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.h1 
            ref={heroTitleRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-title text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-3 sm:mb-4 md:mb-6 lg:mb-8 leading-tight"
          >
            Algorithmic Trading
            <br />
            <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-green-500 bg-clip-text text-transparent">
              Reimagined
            </span>
          </motion.h1>
          <motion.p 
            ref={heroSubtitleRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hero-subtitle text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-foreground-muted mb-6 sm:mb-6 md:mb-8 lg:mb-12 max-w-4xl mx-auto leading-relaxed px-2 sm:px-4"
          >
            Non-custodial, verifiable, and AI-powered trading platform. 
            <br className="hidden sm:block" />
            Execute deterministic strategies with zero-cost local AI assistance.
          </motion.p>
          

          {/* Enhanced Process indicators with anime.js animations */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="hero-process grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-6 lg:gap-8 max-w-4xl mx-auto px-4"
          >
            <div className="flex flex-col items-center text-center group">
              <div className="relative mb-3">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">Connect APIs</h3>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed px-2">Secure integration with your favorite exchanges</p>
            </div>
            
            <div className="flex flex-col items-center text-center group">
              <div className="relative mb-3">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">Configure Risk</h3>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed px-2">Set your limits and safety parameters</p>
            </div>
            
            <div className="flex flex-col items-center text-center group">
              <div className="relative mb-3">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">Start Trading</h3>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed px-2">Execute strategies with AI assistance</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-12 sm:py-16 md:py-20 px-3 sm:px-6 lg:px-8 bg-brand-card/30 backdrop-blur-xl border-y border-brand-border/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            <StatsCard number="<15ms" label="Router Decision Time" delay={0.1} />
            <StatsCard number="99.8%" label="Uptime Guarantee" delay={0.2} />
            <StatsCard number="$0" label="AI Analysis Cost" delay={0.3} />
            <StatsCard number="12+" label="Supported Exchanges" delay={0.4} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 md:py-20 lg:py-32 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12 md:mb-16 lg:mb-20"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 md:mb-6">
              Built for
              <span className="bg-gradient-to-r from-amber-500 to-green-500 bg-clip-text text-transparent"> Professional </span>
              Traders
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-foreground-muted max-w-3xl mx-auto px-2 sm:px-4">
              Every feature designed with transparency, security, and performance in mind
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <FeatureCard
              icon={<Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
              title="Non-Custodial Security"
              description="Your API keys are AES-GCM encrypted client-side. We never hold your funds or private keys. Full audit transparency with tamper-evident logs."
              delay={0.1}
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
              title="Deterministic Execution"
              description="Every trade follows the same rule set with verifiable PnL. Router decisions in under 50ms with latency-aware venue selection."
              delay={0.2}
            />
            <FeatureCard
              icon={<Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
              title="Zero-Cost AI"
              description="Local Ollama/WebGPU AI for risk analysis and trading insights. No external API costs, complete privacy, runs entirely on your hardware."
              delay={0.3}
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
              title="Verifiable Performance"
              description="Cryptographic proof of every PnL calculation. Daily Merkle roots ensure tamper-evident trading history you can independently verify."
              delay={0.4}
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
              title="Smart Multi-Venue Router"
              description="Real-time effective pricing including fees, slippage, and latency penalties. Automatic venue rotation based on performance metrics."
              delay={0.5}
            />
            <FeatureCard
              icon={<Lock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
              title="Risk-First Design"
              description="Configurable position limits, stop-losses, and kill switches. Risk Guard prevents AI suggestions from exceeding your parameters."
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section with proper responsive design */}
      <section className="relative py-16 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Enhanced background with proper light/dark mode support */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-surface-secondary to-surface-tertiary dark:from-slate-950 dark:via-slate-900 dark:to-slate-800"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-slate-500/5"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-slate-500/10 to-transparent rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-orange-500/5 to-slate-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            {/* Redesigned heading with better responsive typography */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-4 sm:mb-6 lg:mb-8 leading-tight">
              Ready to Trade
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 bg-clip-text text-transparent"> Smarter?</span>
            </h2>
            
            {/* Enhanced subtitle with better spacing */}
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-foreground-muted mb-8 sm:mb-10 lg:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
              Join the next generation of algorithmic traders.
              <br className="hidden sm:block" />
              Start with paper trading, upgrade when ready.
            </p>
            
            {/* Enhanced CTA buttons with better responsive design */}
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center max-w-2xl mx-auto">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(249, 115, 22, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 sm:px-10 lg:px-12 py-3 sm:py-4 lg:py-5 rounded-xl font-semibold text-base sm:text-lg shadow-2xl transition-all duration-300 border border-orange-400/20"
                >
                  Start Free Trial
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(51, 65, 85, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto bg-background/80 hover:bg-surface-secondary/80 dark:bg-slate-800/70 dark:hover:bg-slate-700/80 text-foreground px-8 sm:px-10 lg:px-12 py-3 sm:py-4 lg:py-5 rounded-xl font-semibold text-base sm:text-lg border border-border hover:border-orange-500/30 backdrop-blur-sm transition-all duration-300"
                >
                  View Documentation
                </motion.button>
              </div>
            )}
            
            {/* Enhanced features preview */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="mt-12 sm:mt-16 lg:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 text-center"
            >
              <div className="group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                  <Shield className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-1 sm:mb-2">Zero Risk Start</h3>
                <p className="text-xs sm:text-sm text-foreground-muted">Paper trading with real market data</p>
              </div>
              
              <div className="group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                  <Zap className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-1 sm:mb-2">Instant Setup</h3>
                <p className="text-xs sm:text-sm text-foreground-muted">Connect and start trading in minutes</p>
              </div>
              
              <div className="group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                  <Brain className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground mb-1 sm:mb-2">AI Powered</h3>
                <p className="text-xs sm:text-sm text-foreground-muted">Local AI analysis at zero cost</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Modern and responsive */}
      <footer className="bg-background border-t border-border py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500/10 to-slate-500/10 rounded-lg flex items-center justify-center mr-3 shadow-md">
                  <img 
                    src="/cryonel_logo_cube.svg" 
                    alt="CRYONEL 3D Logo" 
                    className="w-6 h-6" 
                  />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-slate-600 bg-clip-text text-transparent">
                  CRYONEL
                </span>
              </div>
              <p className="text-muted-foreground text-sm lg:text-base leading-relaxed">
                Professional algorithmic trading platform built for the modern trader. Secure, transparent, and performance-driven.
              </p>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4 text-base">Platform</h4>
              <ul className="space-y-3 text-muted-foreground text-sm">
                <li><Link to="/dashboard" className="hover:text-foreground transition-colors hover:translate-x-1 transform duration-200 inline-block">Dashboard</Link></li>
                <li><Link to="/strategies" className="hover:text-foreground transition-colors hover:translate-x-1 transform duration-200 inline-block">Strategies</Link></li>
                <li><Link to="/analytics" className="hover:text-foreground transition-colors hover:translate-x-1 transform duration-200 inline-block">Analytics</Link></li>
                <li><Link to="/api" className="hover:text-foreground transition-colors hover:translate-x-1 transform duration-200 inline-block">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4 text-base">Resources</h4>
              <ul className="space-y-3 text-muted-foreground text-sm">
                <li><Link to="/docs" className="hover:text-foreground transition-colors hover:translate-x-1 transform duration-200 inline-block">Documentation</Link></li>
                <li><Link to="/security" className="hover:text-foreground transition-colors hover:translate-x-1 transform duration-200 inline-block">Security</Link></li>
                <li><Link to="/status" className="hover:text-foreground transition-colors hover:translate-x-1 transform duration-200 inline-block">Status</Link></li>
                <li><Link to="/support" className="hover:text-foreground transition-colors hover:translate-x-1 transform duration-200 inline-block">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground font-semibold mb-4 text-base">Company</h4>
              <ul className="space-y-3 text-muted-foreground text-sm">
                <li><Link to="/about" className="hover:text-foreground transition-colors hover:translate-x-1 transform duration-200 inline-block">About</Link></li>
                <li><Link to="/blog" className="hover:text-foreground transition-colors hover:translate-x-1 transform duration-200 inline-block">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-foreground transition-colors hover:translate-x-1 transform duration-200 inline-block">Careers</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors hover:translate-x-1 transform duration-200 inline-block">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-center sm:text-left">
              <p className="text-muted-foreground text-sm">&copy; 2025 Cryonel. All rights reserved.</p>
              <p className="text-muted-foreground text-xs mt-1">
                Built with security, transparency, and performance in mind.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground text-xs transition-colors">Privacy</Link>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground text-xs transition-colors">Terms</Link>
              <Link to="/cookies" className="text-muted-foreground hover:text-foreground text-xs transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
