// apps/web/src/pages/OnboardingPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { CheckCircle, ChevronLeft, ChevronRight, User, Key, Wallet, Shield, Bell, Check } from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  isCompleted: boolean;
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    profile: { firstName: '', lastName: '', timezone: 'UTC' },
    apiKeys: { exchange: 'binance', apiKey: '', apiSecret: '' },
    wallet: { address: '', network: 'solana' },
    riskLimits: { maxPositionSize: 10, maxDailyLoss: 5, stopLoss: 2 },
    alerts: { email: true, push: true, sms: false }
  });

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: 'Profile Setup',
      description: 'Tell us about yourself',
      icon: <User className="h-5 w-5" />,
      component: <ProfileStep formData={formData.profile} setFormData={(data) => updateFormData('profile', data)} />,
      isCompleted: completedSteps.includes(1)
    },
    {
      id: 2,
      title: 'Exchange Connection',
      description: 'Connect your CEX API keys',
      icon: <Key className="h-5 w-5" />,
      component: <APIKeysStep formData={formData.apiKeys} setFormData={(data) => updateFormData('apiKeys', data)} />,
      isCompleted: completedSteps.includes(2)
    },
    {
      id: 3,
      title: 'Wallet Setup',
      description: 'Connect your Solana wallet',
      icon: <Wallet className="h-5 w-5" />,
      component: <WalletStep formData={formData.wallet} setFormData={(data) => updateFormData('wallet', data)} />,
      isCompleted: completedSteps.includes(3)
    },
    {
      id: 4,
      title: 'Risk Management',
      description: 'Set your trading limits',
      icon: <Shield className="h-5 w-5" />,
      component: <RiskLimitsStep formData={formData.riskLimits} setFormData={(data) => updateFormData('riskLimits', data)} />,
      isCompleted: completedSteps.includes(4)
    },
    {
      id: 5,
      title: 'Alert Preferences',
      description: 'Configure notifications',
      icon: <Bell className="h-5 w-5" />,
      component: <AlertsStep formData={formData.alerts} setFormData={(data) => updateFormData('alerts', data)} />,
      isCompleted: completedSteps.includes(5)
    }
  ];

  const updateFormData = (section: keyof typeof formData, data: any) => {
    setFormData(prev => ({ ...prev, [section]: data }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const handleFinish = () => {
    // Mark all steps as completed
    setCompletedSteps([1, 2, 3, 4, 5]);
    // Navigate to dashboard
    navigate('/dashboard');
  };

  const currentStepData = steps.find(step => step.id === currentStep);
  const progress = (completedSteps.length / steps.length) * 100;
  const canProceed = completedSteps.includes(currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-0 to-bg-1 p-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-text-hi mb-2">Welcome to CRYONEL</h1>
          <p className="text-text-low text-lg">Let's get you set up in a few simple steps</p>
          <div className="mt-4">
            <Badge variant="secondary" className="text-sm">
              Step {currentStep} of {steps.length}
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-low">Progress</span>
            <span className="text-sm font-medium text-text-hi">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all cursor-pointer ${
                step.id === currentStep
                  ? 'border-primary bg-primary/10'
                  : step.isCompleted
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-border-hair bg-surf-0'
              }`}
              onClick={() => setCurrentStep(step.id)}
            >
              <div className={`p-2 rounded-full mb-2 ${
                step.isCompleted ? 'bg-green-500 text-white' : 'bg-surf-1 text-text-low'
              }`}>
                {step.isCompleted ? <Check className="h-4 w-4" /> : step.icon}
              </div>
              <h3 className="text-sm font-medium text-center text-text-hi">{step.title}</h3>
              <p className="text-xs text-center text-text-low mt-1">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Current Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                {currentStepData?.icon}
              </div>
              <div>
                <CardTitle className="text-2xl">{currentStepData?.title}</CardTitle>
                <CardDescription className="text-lg">{currentStepData?.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {currentStepData?.component}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-3">
            {currentStep < steps.length ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={completedSteps.length < steps.length}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4" />
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components
function ProfileStep({ formData, setFormData }: { formData: any; setFormData: (data: any) => void }) {
  const [isValid, setIsValid] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setIsValid(newData.firstName.trim() !== '' && newData.lastName.trim() !== '');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-hi mb-2">First Name</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className="w-full px-3 py-2 border border-border-hair rounded-md bg-surf-0 text-text-hi focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your first name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-hi mb-2">Last Name</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className="w-full px-3 py-2 border border-border-hair rounded-md bg-surf-0 text-text-hi focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your last name"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text-hi mb-2">Timezone</label>
        <select
          value={formData.timezone}
          onChange={(e) => handleInputChange('timezone', e.target.value)}
          className="w-full px-3 py-2 border border-border-hair rounded-md bg-surf-0 text-text-hi focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="UTC">UTC</option>
          <option value="EST">Eastern Time</option>
          <option value="PST">Pacific Time</option>
          <option value="CET">Central European Time</option>
          <option value="JST">Japan Standard Time</option>
        </select>
      </div>
      {isValid && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">Profile information complete</span>
        </div>
      )}
    </div>
  );
}

function APIKeysStep({ formData, setFormData }: { formData: any; setFormData: (data: any) => void }) {
  const [isValid, setIsValid] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setIsValid(newData.apiKey.trim() !== '' && newData.apiSecret.trim() !== '');
  };

  return (
    <div className="space-y-4">
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-600 mb-2">
          <Shield className="h-4 w-4" />
          <span className="font-medium">Security Notice</span>
        </div>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          Your API keys are encrypted and stored securely. We never have withdrawal access to your funds.
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-text-hi mb-2">Exchange</label>
        <select
          value={formData.exchange}
          onChange={(e) => handleInputChange('exchange', e.target.value)}
          className="w-full px-3 py-2 border border-border-hair rounded-md bg-surf-0 text-text-hi focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="binance">Binance</option>
          <option value="bybit">Bybit</option>
          <option value="kraken">Kraken</option>
          <option value="coinbase">Coinbase</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-text-hi mb-2">API Key</label>
        <input
          type="text"
          value={formData.apiKey}
          onChange={(e) => handleInputChange('apiKey', e.target.value)}
          className="w-full px-3 py-2 border border-border-hair rounded-md bg-surf-0 text-text-hi focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Enter your API key"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-text-hi mb-2">API Secret</label>
        <input
          type="password"
          value={formData.apiSecret}
          onChange={(e) => handleInputChange('apiSecret', e.target.value)}
          className="w-full px-3 py-2 border border-border-hair rounded-md bg-surf-0 text-text-hi focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Enter your API secret"
        />
      </div>
      
      {isValid && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">API keys configured</span>
        </div>
      )}
    </div>
  );
}

function WalletStep({ formData, setFormData }: { formData: any; setFormData: (data: any) => void }) {
  const [isValid, setIsValid] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setIsValid(newData.address.trim() !== '');
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-600 mb-2">
          <Wallet className="h-4 w-4" />
          <span className="font-medium">Wallet Connection</span>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Connect your Solana wallet to enable DEX trading and portfolio tracking.
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-text-hi mb-2">Network</label>
        <select
          value={formData.network}
          onChange={(e) => handleInputChange('network', e.target.value)}
          className="w-full px-3 py-2 border border-border-hair rounded-md bg-surf-0 text-text-hi focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="solana">Solana</option>
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-text-hi mb-2">Wallet Address</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          className="w-full px-3 py-2 border border-border-hair rounded-md bg-surf-0 text-text-hi focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Enter your wallet address"
        />
      </div>
      
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1">
          Connect Phantom
        </Button>
        <Button variant="outline" className="flex-1">
          Connect Solflare
        </Button>
      </div>
      
      {isValid && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">Wallet connected</span>
        </div>
      )}
    </div>
  );
}

function RiskLimitsStep({ formData, setFormData }: { formData: any; setFormData: (data: any) => void }) {
  const [isValid, setIsValid] = useState(false);

  const handleInputChange = (field: string, value: number) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setIsValid(newData.maxPositionSize > 0 && newData.maxDailyLoss > 0 && newData.stopLoss > 0);
  };

  return (
    <div className="space-y-4">
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 text-orange-600 mb-2">
          <Shield className="h-4 w-4" />
          <span className="font-medium">Risk Management</span>
        </div>
        <p className="text-sm text-orange-700 dark:text-orange-300">
          Set limits to protect your capital and manage risk exposure.
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-text-hi mb-2">
          Max Position Size (% of portfolio)
        </label>
        <input
          type="number"
          value={formData.maxPositionSize}
          onChange={(e) => handleInputChange('maxPositionSize', parseFloat(e.target.value))}
          className="w-full px-3 py-2 border border-border-hair rounded-md bg-surf-0 text-text-hi focus:outline-none focus:ring-2 focus:ring-primary"
          min="1"
          max="100"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-text-hi mb-2">
          Max Daily Loss (% of portfolio)
        </label>
        <input
          type="number"
          value={formData.maxDailyLoss}
          onChange={(e) => handleInputChange('maxDailyLoss', parseFloat(e.target.value))}
          className="w-full px-3 py-2 border border-border-hair rounded-md bg-surf-0 text-text-hi focus:outline-none focus:ring-2 focus:ring-primary"
          min="1"
          max="20"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-text-hi mb-2">
          Stop Loss (% per trade)
        </label>
        <input
          type="number"
          value={formData.stopLoss}
          onChange={(e) => handleInputChange('stopLoss', parseFloat(e.target.value))}
          className="w-full px-3 py-2 border border-border-hair rounded-md bg-surf-0 text-text-hi focus:outline-none focus:ring-2 focus:ring-primary"
          min="0.5"
          max="10"
          step="0.5"
        />
      </div>
      
      {isValid && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">Risk limits configured</span>
        </div>
      )}
    </div>
  );
}

function AlertsStep({ formData, setFormData }: { formData: any; setFormData: (data: any) => void }) {
  const handleToggle = (field: string) => {
    setFormData({ ...formData, [field]: !formData[field] });
  };

  return (
    <div className="space-y-4">
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-600 mb-2">
          <Bell className="h-4 w-4" />
          <span className="font-medium">Stay Informed</span>
        </div>
        <p className="text-sm text-green-700 dark:text-green-300">
          Choose how you want to receive notifications about your trading activities.
        </p>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 border border-border-hair rounded-lg">
          <div>
            <h4 className="font-medium text-text-hi">Email Notifications</h4>
            <p className="text-sm text-text-low">Receive alerts via email</p>
          </div>
          <input
            type="checkbox"
            checked={formData.email}
            onChange={() => handleToggle('email')}
            className="w-4 h-4 text-primary bg-surf-0 border-border-hair rounded focus:ring-primary"
          />
        </div>
        
        <div className="flex items-center justify-between p-3 border border-border-hair rounded-lg">
          <div>
            <h4 className="font-medium text-text-hi">Push Notifications</h4>
            <p className="text-sm text-text-low">Receive alerts on your device</p>
          </div>
          <input
            type="checkbox"
            checked={formData.push}
            onChange={() => handleToggle('push')}
            className="w-4 h-4 text-primary bg-surf-0 border-border-hair rounded focus:ring-primary"
          />
        </div>
        
        <div className="flex items-center justify-between p-3 border border-border-hair rounded-lg">
          <div>
            <h4 className="font-medium text-text-hi">SMS Notifications</h4>
            <p className="text-sm text-text-low">Receive alerts via text message</p>
          </div>
          <input
            type="checkbox"
            checked={formData.sms}
            onChange={() => handleToggle('sms')}
            className="w-4 h-4 text-primary bg-surf-0 border-border-hair rounded focus:ring-primary"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">Alert preferences configured</span>
      </div>
    </div>
  );
}
