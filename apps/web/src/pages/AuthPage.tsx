// apps/web/src/pages/AuthPage.tsx
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';
import { oauthService } from '../services/oauthService';
import { LoginCredentials, RegisterData } from '../types';
import { Chrome, Mail, Lock, User, TrendingUp, Wallet } from 'lucide-react';
import { animations } from '../utils/animations';

export default function AuthPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const mode = searchParams.get('mode') || 'login';
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<LoginCredentials | RegisterData>({
        email: '',
        password: '',
        ...(mode === 'register' && { username: '' }),
        ...(mode === 'register' && { confirmPassword: '' }),
    });

    const { login: storeLogin } = useAuthStore();
    
    // Refs for anime.js animations
    const brandingRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef<HTMLDivElement>(null);
    const oauthButtonsRef = useRef<HTMLDivElement>(null);
    const backgroundDecoRef = useRef<HTMLDivElement>(null);

    // Initialize animations on component mount
    useEffect(() => {
        // Animate branding section
        if (brandingRef.current) {
            animations.slideIn(brandingRef.current, 'left', 800, 200);
        }

        // Animate features with stagger
        if (featuresRef.current) {
            const featureItems = featuresRef.current.querySelectorAll('.feature-item');
            featureItems.forEach((item, index) => {
                animations.slideIn(item as HTMLElement, 'left', 600, 400 + (index * 100));
            });
        }

        // Animate form
        if (formRef.current) {
            animations.slideIn(formRef.current, 'right', 800, 300);
        }

        // Animate OAuth buttons
        if (oauthButtonsRef.current) {
            const buttons = oauthButtonsRef.current.querySelectorAll('button');
            buttons.forEach((button, index) => {
                animations.slideIn(button as HTMLElement, 'up', 500, 600 + (index * 100));
            });
        }

        // Animate background decorations
        if (backgroundDecoRef.current) {
            const decorations = backgroundDecoRef.current.querySelectorAll('.bg-decoration');
            decorations.forEach((decoration, index) => {
                animations.floating(decoration as HTMLElement, 3000 + (index * 1000), index * 500);
            });
        }
    }, []);

    // Animate mode transitions
    useEffect(() => {
        if (formRef.current) {
            const formElements = formRef.current.querySelectorAll('.form-field');
            formElements.forEach((element, index) => {
                animations.slideIn(element as HTMLElement, 'up', 400, index * 50);
            });
        }
    }, [mode]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError(null);
    };

    const validateForm = (): boolean => {
        if (!formData.email || !formData.password) {
            setError('Please fill in all required fields');
            return false;
        }

        if (mode === 'register') {
            const registerData = formData as RegisterData;
            if (registerData.password !== registerData.confirmPassword) {
                setError('Passwords do not match');
                return false;
            }

            if (registerData.password.length < 8) {
                setError('Password must be at least 8 characters long');
                return false;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
                setError('Please enter a valid email address');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                const response = await authService.login(formData as LoginCredentials);

                if (response.success && response.data) {
                    // Set tokens in AuthService first
                    authService.setTokens(response.data.tokens);
                    
                    // Then store in Zustand store
                    storeLogin(response.data.user, response.data.tokens);
                    navigate('/dashboard');
                } else {
                    setError(response.error?.message || 'Login failed');
                }
            } else {
                const response = await authService.register(formData as RegisterData);

                if (response.success && response.data) {
                    // Registration successful, now auto-login
                    const loginResponse = await authService.login({
                        email: formData.email,
                        password: formData.password
                    });

                    if (loginResponse.success && loginResponse.data) {
                        // Set tokens in AuthService first
                        authService.setTokens(loginResponse.data.tokens);
                        
                        // Then store in Zustand store
                        storeLogin(loginResponse.data.user, loginResponse.data.tokens);
                        navigate('/onboarding');
                    } else {
                        // Registration succeeded but login failed - redirect to login
                        setError('Registration successful! Please log in.');
                        setTimeout(() => {
                            navigate('/auth?mode=login');
                        }, 2000);
                    }
                } else {
                    setError(response.error?.message || 'Registration failed');
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuthLogin = async (provider: 'google' | 'apple' | 'x' | 'wallet') => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Redirect to backend OAuth endpoint
            if (provider === 'google') {
                await oauthService.authenticateWithGoogle();
            } else if (provider === 'apple') {
                // Apple OAuth implementation
                console.log('Apple OAuth not implemented yet');
                setError('Apple login not available yet');
            } else if (provider === 'x') {
                // X (Twitter) OAuth implementation  
                console.log('X OAuth not implemented yet');
                setError('X login not available yet');
            } else if (provider === 'wallet') {
                // Wallet Connect implementation
                console.log('Wallet Connect not implemented yet');
                setError('Wallet Connect not available yet');
            }
        } catch (err) {
            setError(`${provider} login failed`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative">
            {/* Modern gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
            
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" 
                 style={{
                     backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                     backgroundSize: '24px 24px'
                 }} 
            />

            <div className="min-h-screen flex">
                {/* Left side - Branding/Info (hidden on mobile) */}
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 to-primary/5 p-12 items-center justify-center relative overflow-hidden">
                    <div ref={brandingRef} className="relative z-10 max-w-md opacity-0">
                        <div className="flex items-center mb-8">
                            <img src="/cryonel_logo_cube.svg" alt="CRYONEL" className="w-12 h-12 mr-4" />
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                CRYONEL
                            </h1>
                        </div>
                        <h2 className="text-3xl font-bold text-foreground mb-4">
                            Professional Trading Platform
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8">
                            Advanced algorithmic trading with AI-powered analysis, zero-cost intelligence, and institutional-grade security.
                        </p>
                        <div ref={featuresRef} className="space-y-4">
                            <div className="feature-item flex items-center gap-3 opacity-0">
                                <div className="w-2 h-2 bg-primary rounded-full" />
                                <span className="text-muted-foreground">Non-custodial & secure</span>
                            </div>
                            <div className="feature-item flex items-center gap-3 opacity-0">
                                <div className="w-2 h-2 bg-primary rounded-full" />
                                <span className="text-muted-foreground">Verifiable performance</span>
                            </div>
                            <div className="feature-item flex items-center gap-3 opacity-0">
                                <div className="w-2 h-2 bg-primary rounded-full" />
                                <span className="text-muted-foreground">Real-time analytics</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Background decoration */}
                    <div ref={backgroundDecoRef}>
                        <div className="bg-decoration absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-0" />
                        <div className="bg-decoration absolute bottom-20 left-20 w-48 h-48 bg-secondary/10 rounded-full blur-2xl opacity-0" />
                    </div>
                </div>

                {/* Right side - Auth Form */}
                <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
                    <div ref={formRef} className="w-full max-w-md opacity-0">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-card to-muted rounded-xl flex items-center justify-center mr-3 border border-border shadow-lg">
                                    <img src="/cryonel_logo_cube.svg" alt="CRYONEL Logo" className="w-8 h-8" />
                                </div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-200 via-orange-500 to-slate-200 bg-clip-text text-transparent">
                                    CRYONEL
                                </h1>
                            </div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                {mode === 'register' ? 'Create Account' : 'Welcome Back'}
                            </h2>
                            <p className="text-muted-foreground">
                                {mode === 'register' 
                                    ? 'Join the future of algorithmic trading' 
                                    : 'Sign in to your trading dashboard'
                                }
                            </p>
                        </div>

                        {/* Auth Card */}
                        <div className="glass border border-border rounded-2xl p-8 shadow-2xl">
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                            >
                                <p className="text-sm text-red-400">{error}</p>
                            </motion.div>
                        )}

                        {/* OAuth Buttons */}
                        <div ref={oauthButtonsRef} className="space-y-4 mb-8">
                            {/* Google */}
                            <motion.button
                                onClick={() => handleOAuthLogin('google')}
                                disabled={isLoading}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-white dark:bg-white hover:bg-gray-50 text-gray-900 font-medium py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl border border-gray-200 group"
                            >
                                <div className="w-5 h-5 bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                </div>
                                <span className="font-semibold">Continue with Google</span>
                            </motion.button>
                            
                            {/* Grid for Apple, X, and Wallet Connect */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                {/* Apple */}
                                <motion.button
                                    onClick={() => handleOAuthLogin('apple')}
                                    disabled={isLoading}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="bg-black dark:bg-gray-900 hover:bg-gray-900 dark:hover:bg-black text-white font-medium py-3.5 px-2 sm:px-4 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all duration-300 border border-gray-800 hover:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl group"
                                >
                                    <div className="w-5 h-5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                                        </svg>
                                    </div>
                                    <span className="font-semibold text-xs sm:text-sm">Apple</span>
                                </motion.button>

                                {/* X (Twitter) */}
                                <motion.button
                                    onClick={() => handleOAuthLogin('x')}
                                    disabled={isLoading}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="bg-black dark:bg-gray-900 hover:bg-gray-900 dark:hover:bg-black text-white font-medium py-3.5 px-2 sm:px-4 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all duration-300 border border-gray-800 hover:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl group"
                                >
                                    <div className="w-5 h-5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                        </svg>
                                    </div>
                                    <span className="font-semibold text-xs sm:text-sm">X</span>
                                </motion.button>

                                {/* Wallet Connect */}
                                <motion.button
                                    onClick={() => handleOAuthLogin('wallet')}
                                    disabled={isLoading}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3.5 px-2 sm:px-4 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl group"
                                >
                                    <div className="w-5 h-5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <Wallet className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="font-semibold text-xs sm:text-sm">Wallet</span>
                                </motion.button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="relative mb-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-3 bg-card text-muted-foreground">or continue with email</span>
                            </div>
                        </div>

                        {/* Email Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === 'register' && (
                                <div className="form-field opacity-0">
                                    <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                                        Username
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <input
                                            type="text"
                                            id="username"
                                            name="username"
                                            value={(formData as RegisterData).username || ''}
                                            onChange={handleInputChange}
                                            className="w-full bg-input border border-border rounded-xl py-3 px-12 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                                            placeholder="Choose a username"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="form-field opacity-0">
                                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full bg-input border border-border rounded-xl py-3 px-12 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>

                            <div className="form-field opacity-0">
                                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full bg-input border border-border rounded-xl py-3 px-12 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                                        placeholder="Enter your password"
                                    />
                                </div>
                            </div>

                            {mode === 'register' && (
                                <div className="form-field opacity-0">
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={(formData as RegisterData).confirmPassword || ''}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full bg-input border border-border rounded-xl py-3 px-12 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                                            placeholder="Confirm your password"
                                        />
                                    </div>
                                </div>
                            )}

                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-orange-600 to-slate-700 hover:from-orange-700 hover:to-slate-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-lg hover:shadow-xl"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        {mode === 'register' ? 'Creating Account...' : 'Signing In...'}
                                    </div>
                                ) : (
                                    mode === 'register' ? 'Create Account' : 'Sign In'
                                )}
                            </motion.button>
                        </form>

                        {/* Footer Links */}
                        <div className="mt-8 text-center">
                            <p className="text-sm text-muted-foreground">
                                {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}
                                <a
                                    href={`/auth?mode=${mode === 'register' ? 'login' : 'register'}`}
                                    className="text-amber-500 hover:text-amber-400 ml-1 transition-colors"
                                >
                                    {mode === 'register' ? 'Sign In' : 'Sign Up'}
                                </a>
                            </p>
                            
                            {mode === 'login' && (
                                <div className="mt-4">
                                    <a href="/auth?mode=forgot-password" className="text-sm text-amber-500 hover:text-amber-400 transition-colors">
                                        Forgot your password?
                                    </a>
                                </div>
                            )}
                        </div>

                        {mode === 'register' && (
                            <div className="mt-6 text-center">
                                <p className="text-xs text-muted-foreground">
                                    By creating an account, you agree to our{' '}
                                    <a href="#" className="text-amber-500 hover:text-amber-400">Terms of Service</a>{' '}
                                    and{' '}
                                    <a href="#" className="text-amber-500 hover:text-amber-400">Privacy Policy</a>
                                </p>
                            </div>
                        )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}