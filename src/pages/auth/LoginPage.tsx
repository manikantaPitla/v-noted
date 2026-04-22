import { Link } from 'react-router-dom'
import { GoogleLoginButton } from '@/features/auth/components/GoogleLoginButton'
import { PenSquare, Zap, Search, Shield } from 'lucide-react'

export function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-background-secondary">
        {/* Gradient orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-2/3 left-1/4 w-[300px] h-[300px] rounded-full bg-purple-700/8 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-center flex-1 px-16">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center shadow-glow">
              <PenSquare size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary tracking-tight">Vnoted</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-bold text-text-primary leading-tight mb-4">
            Capture ideas{' '}
            <span className="gradient-text">instantly.</span>
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-md mb-12">
            A developer-first note-taking app built for speed, clarity, and zero friction.
          </p>

          {/* Feature pills */}
          <div className="space-y-4">
            {[
              { icon: <Zap size={16} />, text: 'Capture in under 1 second with Ctrl+N' },
              { icon: <Search size={16} />, text: 'Find any note instantly with Ctrl+K search' },
              { icon: <Shield size={16} />, text: 'Auto-saved every 2 seconds, never lose a thought' },
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-accent-subtle border border-accent/20 flex items-center justify-center text-accent flex-shrink-0">
                  {feat.icon}
                </div>
                <span className="text-sm text-text-secondary">{feat.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom brand */}
        <div className="relative z-10 px-16 py-6">
          <p className="text-xs text-text-muted">
            Built for developers & knowledge workers
          </p>
        </div>
      </div>

      {/* Right panel — auth */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[420px] p-8 bg-background">
        {/* Mobile logo */}
        <div className="flex items-center gap-2.5 mb-10 lg:hidden">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-glow">
            <PenSquare size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-text-primary">Vnoted</span>
        </div>

        <div className="w-full max-w-[320px]">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome back</h2>
            <p className="text-sm text-text-secondary">Sign in to access your notes</p>
          </div>

          <GoogleLoginButton />

          <p className="mt-8 text-center text-xs text-text-muted leading-relaxed max-w-[280px] mx-auto">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="text-accent hover:underline font-medium">Terms of Service</Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-accent hover:underline font-medium">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
