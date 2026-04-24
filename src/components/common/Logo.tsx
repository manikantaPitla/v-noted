import { quillFeather } from '@/assets/images'

interface LogoProps {
  variant?: 'login-desktop' | 'login-mobile' | 'dashboard'
}

export function Logo({ variant = 'dashboard' }: LogoProps) {
  if (variant === 'login-desktop') {
    return (
      <div className="flex items-end mb-14 group select-none cursor-default">
        <span className="text-[4.5rem] font-['Caveat',_cursive] font-bold text-white tracking-wide leading-none drop-shadow-md">v-noted</span>
        <div className="relative -translate-y-5 -translate-x-1.5 transition-transform duration-500 group-hover:-translate-y-6 group-hover:translate-x-0 group-hover:rotate-12">
          {/* Custom Image quill pen tinted with accent */}
          <div
            className="bg-accent rotate-[-15deg] w-[48px] h-[48px]"
            style={{
              WebkitMaskImage: `url(${quillFeather})`,
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              filter: "drop-shadow(0 0 12px rgba(var(--accent-rgb),0.8))",
            }}
          />
          {/* Dynamic writing trail effect on hover */}
          <div className="absolute top-[110%] -left-2 w-12 h-0.5 bg-gradient-to-r from-accent to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[1px]" />
        </div>
      </div>
    )
  }

  if (variant === 'login-mobile') {
    return (
      <div className="flex items-end mb-12 lg:hidden group select-none cursor-default relative z-10">
        <span className="text-[3.5rem] font-['Caveat',_cursive] font-bold text-white tracking-wide leading-none drop-shadow-md">v-noted</span>
        <div className="relative -translate-y-4 -translate-x-1 transition-transform duration-500 group-hover:-translate-y-5 group-hover:translate-x-0 group-hover:rotate-12">
          <div
            className="bg-accent rotate-[-15deg] w-[36px] h-[36px]"
            style={{
              WebkitMaskImage: `url(${quillFeather})`,
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              filter: "drop-shadow(0 0 12px rgba(var(--accent-rgb),0.8))",
            }}
          />
        </div>
      </div>
    )
  }

  // Dashboard / Sidebar variant
  return (
    <div className="flex items-end group select-none cursor-default">
      <span className="text-3xl font-['Caveat',_cursive] font-bold text-text-primary tracking-wide leading-none">v-noted</span>
      <div className="relative -translate-y-2 -translate-x-0.5 transition-transform duration-500 group-hover:-translate-y-3 group-hover:translate-x-0 group-hover:rotate-12">
        <div
          className="bg-accent rotate-[-15deg] w-[20px] h-[20px]"
          style={{
            WebkitMaskImage: `url(${quillFeather})`,
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            filter: "drop-shadow(0 0 8px rgba(var(--accent-rgb),0.6))",
          }}
        />
      </div>
    </div>
  )
}
