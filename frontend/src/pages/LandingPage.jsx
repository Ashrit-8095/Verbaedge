import { useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Mic, Target, Brain, TrendingUp, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Mic className="w-8 h-8" />,
      title: "Voice-Based Interviews",
      description: "Practice with natural voice conversations, just like real interviews. No typing required."
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Questions",
      description: "Dynamic questions that adapt based on your responses for a realistic experience."
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Multiple Modes",
      description: "Choose from neutral, strict, or high-pressure interviewer behaviors."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Detailed Feedback",
      description: "Get comprehensive analysis and actionable feedback to improve your skills."
    }
  ];

  const interviewModes = [
    {
      name: "Neutral",
      description: "Friendly and encouraging atmosphere",
      color: "from-green-500 to-emerald-600"
    },
    {
      name: "Strict",
      description: "Direct and detailed questioning",
      color: "from-yellow-500 to-orange-600"
    },
    {
      name: "High Pressure",
      description: "Challenging stress-test environment",
      color: "from-red-500 to-rose-600"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f0f10] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f10]/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold">VerbaEdge</span>
          </div>

          <div className="flex items-center gap-4">
            <SignedOut>
              <Button
                variant="ghost"
                onClick={() => navigate("/sign-in")}
                className="text-white/70 hover:text-white"
                data-testid="nav-signin-btn"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/sign-up")}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                data-testid="nav-signup-btn"
              >
                Get Started
              </Button>
            </SignedOut>
            <SignedIn>
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                data-testid="nav-dashboard-btn"
              >
                Dashboard
              </Button>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-block px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm mb-6">
            AI-Powered Interview Practice
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Master Your Interview
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
              With Voice AI
            </span>
          </h1>
          
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
            Practice interviews with realistic AI conversations. Build confidence, 
            improve communication skills, and ace your next interview.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedOut>
              <Button
                size="lg"
                onClick={() => navigate("/sign-up")}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-lg px-8 py-6"
                data-testid="hero-get-started-btn"
              >
                Start Practicing Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </SignedOut>
            <SignedIn>
              <Button
                size="lg"
                onClick={() => navigate("/interview/setup")}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-lg px-8 py-6"
                data-testid="hero-start-interview-btn"
              >
                Start New Interview
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why Choose VerbaEdge?
          </h2>
          <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
            Our platform provides a realistic interview simulation experience that 
            helps you prepare effectively for any interview scenario.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-violet-500/50 transition-all duration-300"
                data-testid={`feature-card-${index}`}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center text-violet-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interview Modes Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Choose Your Challenge Level
          </h2>
          <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
            Practice with different interviewer personalities to prepare for any situation.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {interviewModes.map((mode, index) => (
              <div
                key={index}
                className="relative overflow-hidden p-8 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300 group"
                data-testid={`mode-card-${mode.name.toLowerCase()}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${mode.color} flex items-center justify-center mb-6`}>
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{mode.name}</h3>
                <p className="text-white/60">{mode.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Sign Up", desc: "Create your free account in seconds" },
              { step: "2", title: "Configure", desc: "Choose job role, type, and interviewer mode" },
              { step: "3", title: "Practice", desc: "Have a real voice conversation with AI" },
              { step: "4", title: "Improve", desc: "Review feedback and track your progress" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-white/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-white/60 mb-8 text-lg">
            Join thousands of job seekers who have improved their interview skills with VerbaEdge.
          </p>
          <SignedOut>
            <Button
              size="lg"
              onClick={() => navigate("/sign-up")}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-lg px-8 py-6"
              data-testid="cta-signup-btn"
            >
              Get Started for Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </SignedOut>
          <SignedIn>
            <Button
              size="lg"
              onClick={() => navigate("/interview/setup")}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-lg px-8 py-6"
              data-testid="cta-start-btn"
            >
              Start Your Interview
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </SignedIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <span className="font-semibold">VerbaEdge</span>
          </div>
          <p className="text-white/40 text-sm">
            © 2026 VerbaEdge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
