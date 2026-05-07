import { logoDark, logoLight } from '@/assets/svg'
import { useTheme } from '@/app/providers/ThemeProvider'

interface LogoProps {
  variant?: 'login-desktop' | 'login-mobile' | 'dashboard'
}

export function Logo({ variant = 'dashboard' }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const logo = resolvedTheme === 'dark' ? logoLight : logoDark

  if (variant === 'login-desktop') {
    return (
      <div className="flex items-center mb-14 select-none cursor-default">
        <img 
          src={logo} 
          alt="v-noted" 
          className="h-20 w-auto object-contain drop-shadow-lg" 
        />
      </div>
    )
  }

  if (variant === 'login-mobile') {
    return (
      <div className="flex items-center mb-10 lg:hidden select-none cursor-default relative z-10">
        <img 
          src={logo} 
          alt="v-noted" 
          className="h-14 w-auto object-contain drop-shadow-md" 
        />
      </div>
    )
  }

  // Dashboard / Sidebar variant
  return (
    <div className="flex items-center select-none cursor-default">
      <img 
        src={logo} 
        alt="v-noted" 
        className="h-8 w-auto object-contain" 
      />
    </div>
  )
}
