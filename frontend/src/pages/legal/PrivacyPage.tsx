import React from 'react'
import { ArrowLeft, Shield, Lock, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg text-text-primary p-6 md:p-12 max-w-4xl mx-auto overflow-y-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-accent-subtle flex items-center justify-center text-accent">
          <Shield size={20} />
        </div>
        <h1 className="text-2xl font-bold italic">Privacy Policy</h1>
      </div>
      
      <div className="space-y-10 text-text-secondary leading-relaxed text-sm">
        <section>
          <p className="text-base font-medium text-text-primary/90">Your privacy is at the core of v-noted. We believe your notes are personal, and our policy reflects our commitment to keeping them that way.</p>
        </section>

        <div className="grid md:grid-cols-3 gap-6 py-8">
          <div className="p-6 rounded-2xl bg-surface border border-surface-border">
            <Lock size={20} className="text-accent mb-4" />
            <h2 className="text-text-primary font-semibold mb-2">Secure</h2>
            <p className="text-sm italic">Encrypted in transit and at rest using industry standards.</p>
          </div>
          <div className="p-6 rounded-2xl bg-surface border border-surface-border">
            <Eye size={20} className="text-accent mb-4" />
            <h2 className="text-text-primary font-semibold mb-2">Private</h2>
            <p className="text-sm italic">We never sell your data or use your notes for advertising.</p>
          </div>
          <div className="p-6 rounded-2xl bg-surface border border-surface-border">
            <Shield size={20} className="text-accent mb-4" />
            <h2 className="text-text-primary font-semibold mb-2">Compliant</h2>
            <p className="text-sm italic">Designed with GDPR and CCPA principles in mind.</p>
          </div>
        </div>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-3">1. Data Collection</h2>
          <p>We collect minimal information required to provide the service:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><span className="text-text-primary font-medium">Account Info:</span> Name, email, and avatar provided via Google Login.</li>
            <li><span className="text-text-primary font-medium">Your Content:</span> Notes, categories, and tags you create.</li>
            <li><span className="text-text-primary font-medium">Usage Data:</span> Basic analytics to improve app performance and stability.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-3">2. How We Use Data</h2>
          <p>We use your data solely to provide, maintain, and improve the v-noted application. Your email is used for account identification and critical service updates only.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-3">3. Data Sharing</h2>
          <p>We do not share your personal data with third parties except as necessary to provide the service (e.g., secure cloud hosting providers). We will never sell your personal information or the content of your notes.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-3">4. Your Rights</h2>
          <p>You have the right to access, export, or delete your data at any time. You can use the "Reset Account Data" feature in settings to permanently remove all your notes and categories from our servers.</p>
        </section>

        <footer className="pt-12 border-t border-surface-border text-sm italic">
          Last updated: April 2026
        </footer>
      </div>
    </div>
  )
}
