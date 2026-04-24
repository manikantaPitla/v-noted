import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function TermsPage() {
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

      <h1 className="text-2xl font-bold mb-6 italic">Terms of Service</h1>
      
      <div className="space-y-6 text-text-secondary leading-relaxed text-sm">
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using v-noted, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the service.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-3">2. Description of Service</h2>
          <p>v-noted is a personal productivity and note-taking application. We provide a platform for organizing thoughts, categories, and tags with cloud synchronization.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-3">3. User Content</h2>
          <p>You retain ownership of any content you create within v-noted. By using our service, you grant us a limited license to store, back up, and synchronize your data as necessary to provide the service to you. We do not claim ownership of your notes.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-3">4. Acceptable Use</h2>
          <p>You agree not to use v-noted for any illegal purposes or to upload content that violates the rights of others. We reserve the right to terminate accounts that violate these terms.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-3">5. Disclaimer of Warranties</h2>
          <p>v-noted is provided "as is" without any warranties. While we strive for 100% uptime and data integrity, we are not liable for any data loss or service interruptions.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary mb-3">6. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, v-noted shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the service.</p>
        </section>

        <footer className="pt-12 border-t border-surface-border text-sm italic">
          Last updated: April 2026
        </footer>
      </div>
    </div>
  )
}
