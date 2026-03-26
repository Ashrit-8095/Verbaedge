import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { 
  Mic, ArrowLeft, Award, TrendingUp, MessageSquare, 
  Target, CheckCircle, AlertCircle, RefreshCw, Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InterviewFeedback = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [interview, setInterview] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeedback();
  }, [interviewId]);

  const fetchFeedback = async () => {
    try {
      const token = await getToken();
      
      // Fetch interview details
      const interviewResponse = await axios.get(`${API}/interviews/${interviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInterview(interviewResponse.data);

      // Fetch feedback
      const feedbackResponse = await axios.get(`${API}/interviews/${interviewId}/feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedback(feedbackResponse.data);
      
    } catch (err) {
      console.error("Error fetching feedback:", err);
      setError("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreGradient = (score) => {
    if (score >= 8) return "from-green-500 to-emerald-600";
    if (score >= 6) return "from-yellow-500 to-orange-600";
    return "from-red-500 to-rose-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <TrendingUp className="w-8 h-8 text-violet-400" />
          </div>
          <p className="text-white/60">Analyzing your performance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white mb-4">{error}</p>
          <Button onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f10] text-white">
      {/* Header */}
      <header className="border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
            Dashboard
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <span className="font-semibold">Interview Feedback</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Interview Info */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2" data-testid="feedback-title">
            {interview?.job_role} Interview
          </h1>
          <p className="text-white/60">
            {interview?.interview_type} • {interview?.interviewer_mode?.replace("_", " ")}
          </p>
        </div>

        {/* Overall Score */}
        <Card className="bg-gradient-to-br from-violet-500/20 to-purple-600/20 border-violet-500/30 mb-8">
          <CardContent className="p-8 text-center">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${getScoreGradient(feedback?.overall_score || 0)} mb-4`}>
              <span className="text-4xl font-bold text-white" data-testid="overall-score">
                {feedback?.overall_score || 0}
              </span>
              <span className="text-xl text-white/80">/10</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Overall Performance</h2>
            <p className="text-white/60">{feedback?.detailed_feedback}</p>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-white/60">Communication</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-2xl font-bold ${getScoreColor(feedback?.communication_score || 0)}`} data-testid="communication-score">
                  {feedback?.communication_score || 0}
                </span>
                <span className="text-white/40">/10</span>
              </div>
              <Progress 
                value={(feedback?.communication_score || 0) * 10} 
                className="h-2 bg-white/10"
              />
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-white/60">Technical</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-2xl font-bold ${getScoreColor(feedback?.technical_score || 0)}`} data-testid="technical-score">
                  {feedback?.technical_score || 0}
                </span>
                <span className="text-white/40">/10</span>
              </div>
              <Progress 
                value={(feedback?.technical_score || 0) * 10} 
                className="h-2 bg-white/10"
              />
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-white/60">Confidence</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-2xl font-bold ${getScoreColor(feedback?.confidence_score || 0)}`} data-testid="confidence-score">
                  {feedback?.confidence_score || 0}
                </span>
                <span className="text-white/40">/10</span>
              </div>
              <Progress 
                value={(feedback?.confidence_score || 0) * 10} 
                className="h-2 bg-white/10"
              />
            </CardContent>
          </Card>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {(feedback?.strengths || []).map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2" data-testid={`strength-${idx}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2" />
                    <span className="text-white/80">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                Areas to Improve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {(feedback?.improvements || []).map((improvement, idx) => (
                  <li key={idx} className="flex items-start gap-2" data-testid={`improvement-${idx}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2" />
                    <span className="text-white/80">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate("/interview/setup")}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            data-testid="practice-again-btn"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Practice Again
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="border-white/20 text-white hover:bg-white/10"
            data-testid="go-dashboard-btn"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
};

export default InterviewFeedback;
