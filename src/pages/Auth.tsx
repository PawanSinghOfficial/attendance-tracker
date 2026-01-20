import { useState, useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// Rate limiting: Store OTP send attempts in localStorage
const RATE_LIMIT_KEY = "otp_rate_limit";
const VERIFY_RATE_LIMIT_KEY = "otp_verify_rate_limit";
const MAX_OTP_REQUESTS = 3; // Max 3 OTP requests
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const MAX_VERIFY_ATTEMPTS = 10; // Max 10 verify attempts
const VERIFY_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

interface RateLimitData {
  email: string;
  attempts: number;
  resetTime: number;
}

export default function Auth({ redirectAfterAuth = "/dashboard" }: { redirectAfterAuth?: string }) {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();

  // Timer for resend button
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Email validation function with comprehensive checks
  const validateEmail = (email: string): boolean => {
    const cleanEmail = email.trim();

    // Basic validation
    if (!cleanEmail) {
      setEmailError("Email is required");
      return false;
    }

    // Check minimum length
    if (cleanEmail.length < 5) {
      setEmailError("Email is too short");
      return false;
    }

    // Comprehensive email format validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(cleanEmail)) {
      setEmailError("Please enter a valid email address");
      return false;
    }

    // Additional validation: check for common mistakes
    if (cleanEmail.includes("..")) {
      setEmailError("Email contains consecutive dots");
      return false;
    }

    if (cleanEmail.startsWith(".") || cleanEmail.endsWith(".")) {
      setEmailError("Email cannot start or end with a dot");
      return false;
    }

    // Check for common domain typos
    const domain = cleanEmail.split("@")[1]?.toLowerCase();
    const typos: Record<string, string> = {
      "gmial.com": "gmail.com",
      "gmai.com": "gmail.com",
      "gmil.com": "gmail.com",
      "yahooo.com": "yahoo.com",
      "yaho.com": "yahoo.com",
      "outloook.com": "outlook.com",
      "outlok.com": "outlook.com",
      "hotmial.com": "hotmail.com",
      "hotmil.com": "hotmail.com",
    };

    if (domain && typos[domain]) {
      setEmailError(`Did you mean ${cleanEmail.split("@")[0]}@${typos[domain]}?`);
      return false;
    }

    setEmailError("");
    return true;
  };

  // Check rate limit for OTP sending
  const checkOtpRateLimit = (email: string): boolean => {
    try {
      const stored = localStorage.getItem(RATE_LIMIT_KEY);
      const now = Date.now();

      if (stored) {
        const data: RateLimitData = JSON.parse(stored);

        // Reset if time window has passed or different email
        if (now > data.resetTime || data.email !== email) {
          localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({
            email,
            attempts: 1,
            resetTime: now + RATE_LIMIT_WINDOW,
          }));
          return true;
        }

        // Check if limit exceeded
        if (data.attempts >= MAX_OTP_REQUESTS) {
          const waitMinutes = Math.ceil((data.resetTime - now) / 60000);
          toast.error(`Too many OTP requests. Please try again in ${waitMinutes} minute(s).`);
          return false;
        }

        // Increment attempts
        data.attempts += 1;
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
        return true;
      }

      // First attempt
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({
        email,
        attempts: 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      }));
      return true;
    } catch (error) {
      console.error("Rate limit check error:", error);
      return true; // Allow on error
    }
  };

  // Check rate limit for OTP verification
  const checkVerifyRateLimit = (email: string): boolean => {
    try {
      const stored = localStorage.getItem(VERIFY_RATE_LIMIT_KEY);
      const now = Date.now();

      if (stored) {
        const data: RateLimitData = JSON.parse(stored);

        // Reset if time window has passed or different email
        if (now > data.resetTime || data.email !== email) {
          localStorage.setItem(VERIFY_RATE_LIMIT_KEY, JSON.stringify({
            email,
            attempts: 1,
            resetTime: now + VERIFY_LIMIT_WINDOW,
          }));
          return true;
        }

        // Check if limit exceeded
        if (data.attempts >= MAX_VERIFY_ATTEMPTS) {
          const waitMinutes = Math.ceil((data.resetTime - now) / 60000);
          toast.error(`Too many verification attempts. Please try again in ${waitMinutes} minute(s).`);
          return false;
        }

        // Increment attempts
        data.attempts += 1;
        localStorage.setItem(VERIFY_RATE_LIMIT_KEY, JSON.stringify(data));
        return true;
      }

      // First attempt
      localStorage.setItem(VERIFY_RATE_LIMIT_KEY, JSON.stringify({
        email,
        attempts: 1,
        resetTime: now + VERIFY_LIMIT_WINDOW,
      }));
      return true;
    } catch (error) {
      console.error("Verify rate limit check error:", error);
      return true; // Allow on error
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    // Validate email first
    if (!validateEmail(cleanEmail)) {
      return;
    }

    // Check rate limit
    if (!checkOtpRateLimit(cleanEmail)) {
      return;
    }

    setIsLoading(true);
    try {
      await signIn("email-otp", { email: cleanEmail });
      setStep("otp");
      setOtp(""); // Clear any previous OTP
      setResendTimer(120); // 120 seconds cooldown to prevent rapid invalidation
      toast.success("Code sent! It may take 1-2 minutes to arrive.");
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.message || "Failed to send code. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    const cleanEmail = email.trim().toLowerCase();

    // Check rate limit for verification
    if (!checkVerifyRateLimit(cleanEmail)) {
      return;
    }

    setIsLoading(true);
    try {
      await signIn("email-otp", { email: cleanEmail, code: otp });

      // Clear rate limits on successful sign-in
      localStorage.removeItem(RATE_LIMIT_KEY);
      localStorage.removeItem(VERIFY_RATE_LIMIT_KEY);

      toast.success("Successfully signed in!");
      navigate(redirectAfterAuth);
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.message || "Invalid code. If you requested a new code, please wait for the latest email.";
      toast.error(errorMessage);
      setOtp(""); // Clear OTP to allow easy retry
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <img src="/logo.svg" alt="Logo" className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Sign in to access your attendance tracker</p>
        </div>

        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{step === "email" ? "Sign In" : "Enter Code"}</CardTitle>
            <CardDescription>
              {step === "email"
                ? "Enter your email address to receive a verification code"
                : `We sent a 6-digit code to ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className={`pl-9 ${emailError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        // Clear error when user starts typing
                        if (emailError) setEmailError("");
                      }}
                      onBlur={() => {
                        // Validate on blur
                        if (email.trim()) {
                          validateEmail(email);
                        }
                      }}
                      required
                      autoFocus
                    />
                    {emailError && (
                      <div className="absolute right-3 top-3">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                  </div>
                  {emailError && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {emailError}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || !!emailError}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      Send Code
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2 flex flex-col items-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    autoFocus
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <div className="text-center space-y-1 mt-2">
                    <p className="text-xs text-muted-foreground">
                      Enter the 6-digit code from your email
                    </p>
                    <p className="text-xs text-orange-600 font-medium">
                      Check your spam folder if it doesn't appear within a minute.
                    </p>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Code
                      <CheckCircle2 className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleSendOtp()}
                    disabled={isLoading || resendTimer > 0}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setStep("email")}
                    disabled={isLoading}
                  >
                    Back to Email
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-xs text-muted-foreground text-center">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
