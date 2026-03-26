import { useState } from "react"
import { useNavigate, Link } from "react-router"
import { useAuth } from "../context/AuthContext"
import { supabase } from "../../lib/supabase"
import { Globe, Eye, EyeOff } from "lucide-react"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function mapAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) return "Wrong email or password"
  if (message.includes("User already registered")) return "Account already exists — try signing in"
  return message
}

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState("")
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()

  const validateEmail = (value: string): boolean => {
    if (!EMAIL_REGEX.test(value)) {
      setEmailError("Please enter a valid email address")
      return false
    }
    setEmailError("")
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateEmail(email)) return
    setLoading(true)
    setError("")

    const result = isSignUp
      ? await signUp(email, password, name)
      : await signIn(email, password)

    if (result.error) {
      setError(mapAuthError(result.error))
      setLoading(false)
    } else {
      navigate("/")
    }
  }

  const handleResetPassword = async () => {
    if (!validateEmail(resetEmail)) return
    setResetLoading(true)
    setResetMessage("")
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail)
    setResetLoading(false)
    if (resetError) {
      setResetMessage(resetError.message)
    } else {
      setResetMessage("Check your email for a reset link.")
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <Globe className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">Weventr</span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            {isSignUp ? "Create your account" : "Welcome back"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              required
            />
          )}

          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError("")
              }}
              onBlur={() => { if (email) validateEmail(email) }}
              placeholder="Email"
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              required
            />
            {emailError && (
              <p className="text-red-500 text-xs mt-1.5 ml-2">{emailError}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 pr-14 text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {isSignUp && (
              <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1.5 ml-2">At least 6 characters</p>
            )}
            {!isSignUp && (
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(!showForgotPassword)
                  setResetEmail(email)
                  setResetMessage("")
                }}
                className="text-orange-500 hover:underline text-xs mt-1.5 ml-2 font-medium"
              >
                Forgot password?
              </button>
            )}
          </div>

          {showForgotPassword && !isSignUp && (
            <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetLoading || !resetEmail}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              >
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </button>
              {resetMessage && (
                <p className={`text-sm px-1 ${resetMessage.includes("Check your email") ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                  {resetMessage}
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm bg-red-500/10 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white py-4 rounded-2xl text-[15px] font-semibold transition-all shadow-lg shadow-orange-600/30 disabled:opacity-50"
          >
            {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-zinc-500 dark:text-zinc-400 text-sm mt-6">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(""); setEmailError(""); setShowForgotPassword(false) }}
            className="text-orange-500 hover:underline font-medium"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>

        {isSignUp && (
          <p className="text-center text-zinc-400 dark:text-zinc-500 text-xs mt-6 leading-relaxed">
            By signing up you agree to our{" "}
            <Link to="/terms" className="text-orange-500 hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link to="/privacy" className="text-orange-500 hover:underline">Privacy Policy</Link>
          </p>
        )}

        <p className="text-center text-zinc-400 dark:text-zinc-600 text-xs mt-8">
          Same account works on iOS and web
        </p>
      </div>
    </div>
  )
}
