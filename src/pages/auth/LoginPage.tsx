import { Link } from "react-router-dom";
import { GoogleLoginButton } from "@/features/auth/components/GoogleLoginButton";
import { Zap, Search, Shield } from "lucide-react";
import { useRef, MouseEvent } from "react";
import { Logo } from "@/components/common/Logo";

export function LoginPage() {
  const pageRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pageRef.current.style.setProperty("--mouse-x", `${x}px`);
    pageRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div ref={pageRef} onMouseMove={handleMouseMove} className="min-h-screen bg-background flex relative overflow-hidden group/page">
      {/* Global Interactive Mouse Glow */}
      <div
        className="absolute inset-0 z-50 pointer-events-none opacity-0 group-hover/page:opacity-100 transition-opacity duration-500 mix-blend-screen"
        style={{
          background: "radial-gradient(circle 250px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(var(--accent-rgb), 0.15), transparent 100%)",
        }}
      />

      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[150px] pointer-events-none translate-x-1/3 -translate-y-1/3 z-0" />

      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-background-secondary">
        <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik00MCAwSDB2NDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />

        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-accent/20 to-accent/5 blur-[120px] pointer-events-none animate-pulse-soft mix-blend-screen" />
        <div className="absolute top-2/3 left-1/4 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px] pointer-events-none mix-blend-screen" />

        <div className="relative z-10 flex flex-col justify-center flex-1 px-16">
          <Logo variant="login-desktop" />

          <h1 className="text-5xl font-bold text-text-primary leading-tight mb-4">
            Capture ideas <span className="gradient-text">instantly.</span>
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-md mb-12">A developer-first note-taking app built for speed, clarity, and zero friction.</p>

          <div className="space-y-4">
            {[
              { icon: <Zap size={16} />, text: "Capture in under 1 second with Ctrl+N" },
              { icon: <Search size={16} />, text: "Find any note instantly with Ctrl+K search" },
              { icon: <Shield size={16} />, text: "Auto-saved every 2 seconds, never lose a thought" },
            ].map((feat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-accent-subtle border border-accent/20 flex items-center justify-center text-accent flex-shrink-0">{feat.icon}</div>
                <span className="text-sm text-text-secondary">{feat.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 px-16 py-6">
          <p className="text-xs text-text-muted">Built for developers & knowledge workers</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center w-full lg:w-[420px] p-8 bg-background relative z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-50 pointer-events-none" />

        <Logo variant="login-mobile" />

        <div className="w-full max-w-[320px]">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome back</h2>
            <p className="text-sm text-text-secondary">Sign in to access your notes</p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0 rounded-[18px] blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative">
              <GoogleLoginButton />
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-text-muted leading-relaxed max-w-[280px] mx-auto">
            By signing in, you agree to our{" "}
            <Link to="/terms" className="text-accent hover:underline font-medium">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-accent hover:underline font-medium">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
