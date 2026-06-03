'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Wheel from '@/components/Wheel';
import ResultPopup from '@/components/ResultPopup';
import Turnstile from '@/components/Turnstile';

type Step = 'email' | 'otp' | 'verified' | 'spinning' | 'complete';

export default function SpinPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [participant, setParticipant] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [participants, setParticipants] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [matchedName, setMatchedName] = useState<string | null>(null);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [wheelSelectedName, setWheelSelectedName] = useState<string | null>(null);
  const [hasAlreadySpun, setHasAlreadySpun] = useState(false);
  const [checkingSpinStatus, setCheckingSpinStatus] = useState(true);
  const [otpRequestToken, setOtpRequestToken] = useState<string | null>(null);
  const turnstileRef1 = useRef<any>(null);
  const turnstileRef2 = useRef<any>(null);
  
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

  const handleRequestOTP = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!otpRequestToken) {
      setError('Please complete the verification challenge');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(),
          turnstileToken: otpRequestToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send OTP');
        return;
      }

      setStep('otp');
      setOtpRequestToken(null); // Reset token after use
      if (turnstileRef1.current?.reset) {
        turnstileRef1.current.reset();
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
      setOtpRequestToken(null);
      if (turnstileRef1.current?.reset) {
        turnstileRef1.current.reset();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          otpCode: otpCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid OTP code');
        return;
      }

      setParticipant(data.participant);
      // Fetch all participants for the wheel
      await fetchParticipantsForWheel();
      // Check if participant has already spun
      await checkSpinStatus(data.participant.id);
      setStep('verified');
      if (turnstileRef2.current?.reset) {
        turnstileRef2.current.reset();
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
      if (turnstileRef2.current?.reset) {
        turnstileRef2.current.reset();
      }
    } finally {
      setLoading(false);
    }
  };

  const checkSpinStatus = async (participantId: string) => {
    setCheckingSpinStatus(true);
    try {
      const response = await fetch('/api/spin/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participantId }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.hasSpun && data.matchedParticipant) {
          // They've already spun, show their match
          setHasAlreadySpun(true);
          setMatchedName(data.matchedParticipant.name);
          setShowResultPopup(true);
        } else {
          // They haven't spun yet, enable the button
          setHasAlreadySpun(false);
        }
      }
    } catch (err) {
      console.error('Error checking spin status:', err);
      // On error, assume they haven't spun (safer default)
      setHasAlreadySpun(false);
    } finally {
      setCheckingSpinStatus(false);
    }
  };

  const fetchParticipantsForWheel = async () => {
    try {
      // Fetch all participants from the database for the wheel
      const response = await fetch('/api/participants/wheel');
      
      if (response.ok) {
        const data = await response.json();
        // Show ALL participants on the wheel (including matched ones and current user)
        // The wheel is just for visualization - matching happens server-side
        const allParticipants = data.participants || [];
        setParticipants(allParticipants);
      } else {
        console.error('Failed to fetch participants for wheel');
        // Fallback to empty array if fetch fails
        setParticipants([]);
      }
    } catch (err) {
      console.error('Error setting up wheel:', err);
      setParticipants([]);
    }
  };

  const handleSpinStart = async () => {
    if (!participant) return;
    setStep('spinning');
  };

  const handleWheelSpinComplete = async (selectedName: string) => {
    // Store the name the wheel landed on (for visual reference)
    setWheelSelectedName(selectedName);
    
    if (!participant) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participantId: String(participant.id) }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to complete spin');
        setStep('verified');
        return;
      }

      // Store the matched name to display (from server)
      if (data.matchedParticipant) {
        setMatchedName(data.matchedParticipant.name);
        setStep('complete');
        // Show modal immediately - wheel has already stopped spinning
        setShowResultPopup(true);
      } else {
        setStep('complete');
      }
    } catch (err) {
      setError('Failed to complete spin. Please try again.');
      setStep('verified');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Result Modal with Confetti - Rendered via portal */}
      {showResultPopup && matchedName && (
        <ResultPopup
          isOpen={showResultPopup}
          matchedName={matchedName}
          onClose={() => setShowResultPopup(false)}
        />
      )}
      
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50 dark:from-gray-900 dark:via-red-950 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Christmas decorations */}
        <div className="absolute top-4 left-4 text-3xl animate-bounce">❄️</div>
        <div className="absolute top-4 right-4 text-3xl animate-pulse">🎄</div>
        <div className="absolute bottom-4 left-4 text-3xl animate-bounce delay-300">🎅</div>
        <div className="absolute bottom-4 right-4 text-3xl animate-pulse delay-500">🎁</div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border-4 border-red-200 dark:border-red-900 relative z-10"
        >
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-red-600 to-green-600 bg-clip-text text-transparent">
            🎄 Secret Santa Wheel 🎄
          </h1>

        <AnimatePresence mode="wait">
          {step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Enter your email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRequestOTP()}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 border-2 border-red-300 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-600 dark:text-red-400 text-sm"
                >
                  {error}
                </motion.p>
              )}
              {turnstileSiteKey && (
                <div className="flex justify-center">
                  <Turnstile
                    siteKey={turnstileSiteKey}
                    onVerify={(token) => setOtpRequestToken(token)}
                    onError={() => {
                      setOtpRequestToken(null);
                      setError('Verification failed. Please reload the page and try again.');
                    }}
                    onExpire={() => setOtpRequestToken(null)}
                    theme="auto"
                    size="normal"
                  />
                </div>
              )}
              <button
                onClick={handleRequestOTP}
                disabled={loading || !otpRequestToken || !email.trim()}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:border-gray-400 text-white font-semibold rounded-lg transition-all shadow-lg border-2 border-white"
              >
                {loading ? 'Sending OTP...' : 'Request OTP'}
              </button>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  We've sent a 6-digit OTP code to <strong>{email}</strong>.
                  Please check your email and enter the code below.
                </p>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Enter OTP Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(value);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerifyOTP()}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 border-2 border-red-300 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest"
                />
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-600 dark:text-red-400 text-sm"
                >
                  {error}
                </motion.p>
              )}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setStep('email');
                    setOtpCode('');
                    setError('');
                  }}
                  className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otpCode.length !== 6}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed disabled:border-gray-400 text-white font-semibold rounded-lg transition-all shadow-lg border-2 border-white"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'verified' && (
            <motion.div
              key="verified"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="text-center">
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                  Welcome, <strong>{participant?.name}</strong>! Ready to spin
                  the wheel?
                </p>
              </div>
              {checkingSpinStatus ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">
                    Checking spin status...
                  </p>
                </div>
              ) : participants.length > 0 ? (
                <Wheel
                  participants={participants}
                  onSpinComplete={handleWheelSpinComplete}
                  disabled={hasAlreadySpun || checkingSpinStatus}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">
                    Setting up wheel...
                  </p>
                </div>
              )}
              {hasAlreadySpun && (
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You have already spun the wheel. Your match is shown above.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-6xl mb-4"
              >
                🎁
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                Wheel Spun Successfully!
              </h2>
              {matchedName && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-2xl p-8 mx-auto max-w-md"
                >
                  <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                    Your Secret Santa match is:
                  </p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-red-600 to-green-600 bg-clip-text text-transparent">
                    {matchedName}
                  </p>
                </motion.div>
              )}
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">
                Happy gift giving! 🎉
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
    </>
  );
}

