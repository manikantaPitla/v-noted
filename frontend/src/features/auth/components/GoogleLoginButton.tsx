import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { Loader2 } from 'lucide-react'

export function GoogleLoginButton() {
  const { login, isLoading } = useAuth()

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await login(tokenResponse.access_token)
      } catch (err) {
        console.error('[GoogleLogin] Auth Error:', err)
      }
    },
    onError: (error) => {
      console.error('[GoogleLogin] Google Error:', error)
    },
    flow: 'implicit',
  })

  return (
    <div className="flex flex-col gap-3 w-full">
      <button
        id="google-login-btn"
        onClick={() => handleGoogleLogin()}
        disabled={isLoading}
        className="
          group relative flex items-center justify-center gap-3 w-full px-6 py-3.5
          bg-surface hover:bg-surface-hover text-text-primary font-medium text-sm
          rounded-2xl border border-surface-border shadow-sm
          transition-all duration-200 hover:shadow-md hover:scale-[1.01]
          disabled:opacity-60 disabled:cursor-not-allowed
        "
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin text-text-muted" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
            <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
          </svg>
        )}
        <span>{isLoading ? 'Signing in…' : 'Continue with Google'}</span>
      </button>
    </div>
  )
}
