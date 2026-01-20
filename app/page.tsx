import { Sparkles, Brain, Calendar, MessageSquare } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-semibold text-xl">ContentTwin</span>
          </div>
          <nav className="flex items-center gap-4">
            <a
              href="/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </a>
            <a
              href="/signup"
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Get Started
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Your AI <span className="text-gradient">Content Twin</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            An AI that learns your unique writing style and creates authentic
            content that sounds exactly like you. Build your personal brand on
            autopilot.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/signup"
              className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Start Free Trial
            </a>
            <a
              href="#features"
              className="border border-border px-6 py-3 rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Learn More
            </a>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-muted py-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl font-bold text-center mb-12">
              How It Works
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<Brain className="h-8 w-8 text-primary" />}
                title="Learn Your Voice"
                description="Paste your existing content and our AI builds a comprehensive profile of your unique writing style."
              />
              <FeatureCard
                icon={<Sparkles className="h-8 w-8 text-accent" />}
                title="Generate Content"
                description="Get 3 variations for any topic, each scored for how well it matches your authentic voice."
              />
              <FeatureCard
                icon={<Calendar className="h-8 w-8 text-success" />}
                title="Plan Ahead"
                description="AI proposes a 4-week content calendar based on your pillars and trending topics."
              />
              <FeatureCard
                icon={<MessageSquare className="h-8 w-8 text-info" />}
                title="Refine & Learn"
                description="Give feedback to continuously improve. Your twin gets smarter with every interaction."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to clone your writing style?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join creators who are scaling their content without sacrificing
            authenticity.
          </p>
          <a
            href="/signup"
            className="inline-block bg-primary text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-primary-dark transition-colors"
          >
            Get Started for Free
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} ContentTwin. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-card p-6 rounded-xl border border-border">
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}
