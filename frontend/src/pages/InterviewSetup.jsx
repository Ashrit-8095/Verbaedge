import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, UserButton } from "@clerk/clerk-react";
import { 
  Mic, ArrowLeft, ArrowRight, Briefcase, MessageSquare, 
  Zap, Target, CheckCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InterviewSetup = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    job_role: "",
    interview_type: "behavioral",
    interviewer_mode: "neutral",
    difficulty: "medium"
  });

  const interviewTypes = [
    {
      id: "behavioral",
      name: "Behavioral",
      icon: <MessageSquare className="w-6 h-6" />,
      description: "Focus on past experiences and soft skills",
      examples: ["Tell me about a time...", "How do you handle..."]
    },
    {
      id: "technical",
      name: "Technical",
      icon: <Zap className="w-6 h-6" />,
      description: "Assess technical knowledge and problem-solving",
      examples: ["Explain the concept of...", "How would you design..."]
    },
    {
      id: "mixed",
      name: "Mixed",
      icon: <Target className="w-6 h-6" />,
      description: "Combination of behavioral and technical questions",
      examples: ["Both technical and soft skill questions"]
    }
  ];

  const interviewerModes = [
    {
      id: "neutral",
      name: "Neutral",
      color: "from-green-500 to-emerald-600",
      description: "Friendly and encouraging",
      details: "Professional but supportive atmosphere"
    },
    {
      id: "strict",
      name: "Strict",
      color: "from-yellow-500 to-orange-600",
      description: "Direct and detailed",
      details: "Probes deeper, expects specific answers"
    },
    {
      id: "high_pressure",
      name: "High Pressure",
      color: "from-red-500 to-rose-600",
      description: "Challenging and intense",
      details: "Tests stress handling and quick thinking"
    }
  ];

  const popularRoles = [
    "Software Engineer",
    "Product Manager",
    "Data Scientist",
    "UX Designer",
    "Marketing Manager",
    "Sales Representative",
    "Financial Analyst",
    "Project Manager"
  ];

  const handleStartInterview = async () => {
    if (!config.job_role.trim()) {
      alert("Please enter a job role");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.post(
        `${API}/interviews`,
        config,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate(`/interview/${response.data.id}`);
    } catch (error) {
      console.error("Error creating interview:", error);
      alert("Failed to create interview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-[#0f0f10]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-white/60 hover:text-white transition-colors"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold">Interview Setup</span>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step >= s
                    ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 mx-2 rounded ${
                    step > s ? "bg-violet-500" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Job Role */}
        {step === 1 && (
          <div className="space-y-6" data-testid="step-1">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">What role are you interviewing for?</h2>
              <p className="text-white/60">Enter the position you want to practice for</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="job_role" className="text-white/80 mb-2 block">
                  Job Title
                </Label>
                <Input
                  id="job_role"
                  value={config.job_role}
                  onChange={(e) => setConfig({ ...config, job_role: e.target.value })}
                  placeholder="e.g., Software Engineer"
                  className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-violet-500 h-12 text-lg"
                  data-testid="job-role-input"
                />
              </div>

              <div>
                <p className="text-sm text-white/60 mb-3">Popular roles:</p>
                <div className="flex flex-wrap gap-2">
                  {popularRoles.map((role) => (
                    <button
                      key={role}
                      onClick={() => setConfig({ ...config, job_role: role })}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        config.job_role === role
                          ? "bg-violet-500 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                      data-testid={`role-${role.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <Button
                onClick={() => setStep(2)}
                disabled={!config.job_role.trim()}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                data-testid="next-step-btn"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Interview Type */}
        {step === 2 && (
          <div className="space-y-6" data-testid="step-2">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Choose interview type</h2>
              <p className="text-white/60">Select the type of questions you want to practice</p>
            </div>

            <div className="grid gap-4">
              {interviewTypes.map((type) => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all ${
                    config.interview_type === type.id
                      ? "bg-violet-500/20 border-violet-500"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                  onClick={() => setConfig({ ...config, interview_type: type.id })}
                  data-testid={`type-${type.id}`}
                >
                  <CardContent className="p-4 flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        config.interview_type === type.id
                          ? "bg-violet-500 text-white"
                          : "bg-white/10 text-white/60"
                      }`}
                    >
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{type.name}</h3>
                      <p className="text-white/60 text-sm mb-2">{type.description}</p>
                      <p className="text-white/40 text-xs">
                        Examples: {type.examples.join(", ")}
                      </p>
                    </div>
                    {config.interview_type === type.id && (
                      <CheckCircle className="w-6 h-6 text-violet-400" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-between pt-6">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="text-white/70 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                data-testid="next-step-btn"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Interviewer Mode */}
        {step === 3 && (
          <div className="space-y-6" data-testid="step-3">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Select interviewer style</h2>
              <p className="text-white/60">Choose how challenging you want the interview to be</p>
            </div>

            <div className="grid gap-4">
              {interviewerModes.map((mode) => (
                <Card
                  key={mode.id}
                  className={`cursor-pointer transition-all overflow-hidden ${
                    config.interviewer_mode === mode.id
                      ? "border-2 border-white/40"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                  onClick={() => setConfig({ ...config, interviewer_mode: mode.id })}
                  data-testid={`mode-${mode.id}`}
                >
                  <CardContent className="p-0">
                    <div className="flex items-stretch">
                      <div className={`w-2 bg-gradient-to-b ${mode.color}`} />
                      <div className="p-4 flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-white">{mode.name}</h3>
                          {config.interviewer_mode === mode.id && (
                            <CheckCircle className="w-5 h-5 text-violet-400" />
                          )}
                        </div>
                        <p className="text-white/60 text-sm">{mode.description}</p>
                        <p className="text-white/40 text-xs mt-1">{mode.details}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <Card className="bg-white/5 border-white/10 mt-8">
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold text-white/60 mb-3">Interview Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Role:</span>
                    <span className="text-white font-medium">{config.job_role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Type:</span>
                    <span className="text-white font-medium capitalize">{config.interview_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Mode:</span>
                    <span className="text-white font-medium capitalize">{config.interviewer_mode.replace("_", " ")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-6">
              <Button
                variant="ghost"
                onClick={() => setStep(2)}
                className="text-white/70 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleStartInterview}
                disabled={loading}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 px-8"
                data-testid="start-interview-btn"
              >
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    Start Interview
                    <Mic className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default InterviewSetup;
