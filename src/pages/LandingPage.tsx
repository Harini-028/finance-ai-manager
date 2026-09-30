import { LandingNavbar } from '../components/landing/LandingNavbar';
import { Hero } from '../components/landing/Hero';
import { TrustedBy } from '../components/landing/TrustedBy';
import { Stats } from '../components/landing/Stats';
import { Features } from '../components/landing/Features';
import { FeatureShowcase } from '../components/landing/FeatureShowcase';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Integrations } from '../components/landing/Integrations';
import { Testimonials } from '../components/landing/Testimonials';
import { Pricing } from '../components/landing/Pricing';
import { FAQ } from '../components/landing/FAQ';
import { CTA } from '../components/landing/CTA';
import { Footer } from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950 text-ink-900 dark:text-white">
      <LandingNavbar />
      <main>
        <Hero />
        <TrustedBy />
        <Stats />
        <Features />
        <FeatureShowcase />
        <HowItWorks />
        <Integrations />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
