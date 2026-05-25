'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, ShieldCheck, ArrowLeft, Stethoscope, KeyRound } from 'lucide-react';

type Step = 'email' | 'otp';
type LoginMode = 'otp' | 'password';

export default function DoctorLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handlePasswordLogin = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/doctor/auth/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (data.success && data.verified) {
        window.location.href = '/doctor';
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/doctor/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setDoctorName(data.doctorName || '');
        setStep('otp');
        setResendTimer(60);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otpOverride?: string[]) => {
    const digits = otpOverride ?? otp;
    const otpString = digits.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/doctor/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otpString }),
      });
      const data = await res.json();
      if (data.success && data.verified) {
        // Cookie is set automatically by the API response
        // Redirect to doctor dashboard
        window.location.href = '/doctor';
      } else if (!data.success) {
        setError(data.error || 'Invalid OTP');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered (pass newOtp so we don't rely on state - state may not have updated yet)
    if (value && index === 5 && newOtp.every(d => d !== '')) {
      setTimeout(() => handleVerifyOTP(newOtp), 100);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleVerifyOTP();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      setTimeout(() => handleVerifyOTP(newOtp), 100);
    }
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    setOtp(['', '', '', '', '', '']);
    handleSendOTP();
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-24">
        <div className="mx-auto w-full max-w-[420px]">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-10">
            <img
              src="/images/brand/logo-caps.webp"
              alt="H2H Healthcare"
              className="h-12 sm:h-14 w-auto object-contain"
            />
          </Link>

          {step === 'email' ? (
            <>
              {/* Email Step */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-50 border border-cyan-200 rounded-full text-cyan-700 text-xs font-semibold mb-4">
                  <Stethoscope className="h-3.5 w-3.5" />
                  Doctor Portal
                </div>
                <h1 className="text-[28px] font-semibold text-gray-900 mb-1">Doctor Login</h1>
                <p className="text-[15px] text-gray-500">
                  {loginMode === 'password'
                    ? 'Sign in with the email and temporary password sent when your account was created.'
                    : 'Enter your registered email to receive a one-time login code.'}
                </p>
              </div>

              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg mb-4">
                <button
                  type="button"
                  onClick={() => { setLoginMode('password'); setError(''); }}
                  className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-colors ${
                    loginMode === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMode('otp'); setError(''); }}
                  className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-colors ${
                    loginMode === 'otp' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Email code
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="doctor@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          loginMode === 'password' ? handlePasswordLogin() : handleSendOTP();
                        }
                      }}
                      className="h-12 pl-10 text-[14px] border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
                      disabled={loading}
                    />
                  </div>
                </div>

                {loginMode === 'password' && (
                  <div>
                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="Temporary password from your welcome email"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handlePasswordLogin()}
                        className="h-12 pl-10 text-[14px] border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button
                  onClick={loginMode === 'password' ? handlePasswordLogin : handleSendOTP}
                  disabled={loading || !email.trim() || (loginMode === 'password' && !password)}
                  className="w-full h-12 text-[14px] font-medium bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : loginMode === 'password' ? (
                    <KeyRound className="mr-2 h-4 w-4" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  {loginMode === 'password' ? 'Sign in' : 'Send Login Code'}
                </Button>
              </div>

              <p className="text-center text-[13px] text-gray-400 mt-8">
                Not a doctor?{' '}
                <Link href="/login" className="text-cyan-500 hover:underline font-medium">
                  Patient Login
                </Link>
              </p>
            </>
          ) : (
            <>
              {/* OTP Step */}
              <button
                onClick={() => { setStep('email'); setError(''); setOtp(['', '', '', '', '', '']); }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Change email
              </button>

              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs font-semibold mb-4">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verification
                </div>
                <h1 className="text-[28px] font-semibold text-gray-900 mb-1">Enter OTP</h1>
                <p className="text-[15px] text-gray-500">
                  {doctorName ? `Hi Dr. ${doctorName.replace(/^Dr\.?\s*/i, '')}, w` : 'W'}e sent a 6-digit code to{' '}
                  <span className="font-medium text-gray-700">{email}</span>
                </p>
              </div>

              {/* OTP Input */}
              <div className="flex gap-3 justify-center mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all ${
                      digit
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                        : 'border-gray-200 bg-white text-gray-900 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'
                    }`}
                    disabled={loading}
                  />
                ))}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
                  {error}
                </div>
              )}

              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.some(d => !d)}
                className="w-full h-12 text-[14px] font-medium bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Verify & Login
              </Button>

              {/* Resend */}
              <div className="text-center mt-6">
                {resendTimer > 0 ? (
                  <p className="text-[13px] text-gray-400">
                    Resend code in <span className="font-semibold text-gray-600">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    className="text-[13px] text-cyan-600 hover:text-cyan-700 font-medium hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Side - Dark Panel */}
      <div className="relative hidden lg:block p-4">
        <div className="h-full w-full rounded-3xl bg-gray-900 relative overflow-hidden">
          <div className="absolute top-20 left-20 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-20 w-[350px] h-[350px] bg-teal-500/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px]" />

          <div className="relative z-10 flex flex-col justify-center h-full px-12 xl:px-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-semibold mb-6 w-fit">
              <Stethoscope className="h-3.5 w-3.5" />
              Doctor Portal
            </div>
            <h2 className="text-[36px] xl:text-[42px] font-semibold text-white leading-tight mb-4">
              Welcome to the Doctor Dashboard.
            </h2>
            <p className="text-[16px] text-gray-400 mb-12 max-w-md leading-relaxed">
              Manage your appointments, view patient details, and join video consultations — all from one place.
            </p>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 max-w-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 mb-4">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-[18px] font-semibold text-white mb-2">
                Secure Doctor Access
              </h3>
              <p className="text-[14px] text-gray-400">
                Use your welcome email password, or request a one-time code anytime from the login page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
