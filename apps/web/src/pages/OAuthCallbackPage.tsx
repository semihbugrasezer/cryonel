// apps/web/src/pages/OAuthCallbackPage.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { oauthService } from '../services/oauthService';
import { authService } from '../services/authService';
import { TrendingUp, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function OAuthCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login: storeLogin } = useAuthStore();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                console.log('OAuth callback params:', Object.fromEntries(searchParams.entries()));

                const response = await oauthService.handleOAuthCallback(searchParams);

                if (response.success && response.data) {
                    setStatus('success');

                    // Set tokens in AuthService first
                    authService.setTokens(response.data.tokens);

                    // Then store in Zustand store
                    storeLogin(response.data.user, response.data.tokens);

                    // Redirect to dashboard after a brief success animation
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 2000);
                } else {
                    setStatus('error');
                    setError(response.error?.message || 'OAuth authentication failed');

                    // Redirect to auth page after showing error
                    setTimeout(() => {
                        navigate('/auth?error=oauth_failed');
                    }, 3000);
                }
            } catch (err) {
                console.error('OAuth callback error:', err);
                setStatus('error');
                setError(err instanceof Error ? err.message : 'OAuth callback failed');

                setTimeout(() => {
                    navigate('/auth?error=oauth_failed');
                }, 3000);
            }
        };

        handleCallback();
    }, [searchParams, navigate, storeLogin]);

    const renderContent = () => {
        switch (status) {
            case 'processing':
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Completing Authentication
                        </h2>
                        <p className="text-slate-400">
                            Please wait while we finish setting up your account...
                        </p>
                    </motion.div>
                );

            case 'success':
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                            <CheckCircle className="w-8 h-8 text-white" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Welcome to CRYONEL!
                        </h2>
                        <p className="text-slate-400 mb-4">
                            Your account has been successfully authenticated.
                        </p>
                        <p className="text-sm text-slate-500">
                            Redirecting to dashboard...
                        </p>
                    </motion.div>
                );

            case 'error':
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Authentication Failed
                        </h2>
                        <p className="text-slate-400 mb-4">
                            {error || 'Something went wrong during authentication.'}
                        </p>
                        <p className="text-sm text-slate-500">
                            Redirecting back to login...
                        </p>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-2 h-2 bg-blue-500 rounded-full opacity-60" />
                <div className="absolute top-40 right-20 w-1 h-1 bg-purple-500 rounded-full opacity-80" />
                <div className="absolute bottom-40 left-20 w-3 h-3 bg-cyan-500 rounded-full opacity-40" />
                <div className="absolute bottom-60 right-10 w-2 h-2 bg-pink-500 rounded-full opacity-70" />
            </div>

            <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                CRYONEL
                            </h1>
                        </div>
                    </div>

                    {/* OAuth Callback Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl"
                    >
                        {renderContent()}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}