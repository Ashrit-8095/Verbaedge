import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser, UserButton } from "@clerk/clerk-react";
import { 
  Mic, Plus, History, TrendingUp, Target, ArrowRight, 
  BarChart3, Clock, Award, LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const [stats, setStats] = useState({
    total_interviews: 0,
    average_score: 0,
    interviews_by_type: {},
    recent_scores: []
  });
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      fetchDashboardData();
    }
  }, [isLoaded, user]);

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      
      // Fetch user stats
      const statsResponse = await axios.get(`${API}/user/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsResponse.data);

      // Fetch recent interviews
      const interviewsResponse = await axios.get(`${API}/interviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentInterviews(interviewsResponse.data.slice(0, 5));
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "text-green-400 bg-green-400/10";
      case "in_progress": return "text-yellow-400 bg-yellow-400/10";
      default: return "text-gray-400 bg-gray-400/10";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
        <div className="animate-pulse text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f10] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-[#0f0f10]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold">VerbaEdge</span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/history")}
              className="text-white/70 hover:text-white"
              data-testid="nav-history-btn"
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="welcome-heading">
            Welcome back, {user?.firstName || "there"}!
          </h1>
          <p className="text-white/60">
            Ready to practice your interview skills? Let's get started.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card 
            className="bg-gradient-to-br from-violet-500/20 to-purple-600/20 border-violet-500/30 cursor-pointer hover:border-violet-400/50 transition-all"
            onClick={() => navigate("/interview/setup")}
            data-testid="start-interview-card"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Start New Interview</h3>
                  <p className="text-white/60">Practice with AI-powered voice simulation</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-violet-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white/5 border-white/10 cursor-pointer hover:border-white/20 transition-all"
            onClick={() => navigate("/history")}
            data-testid="view-history-card"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">View History</h3>
                  <p className="text-white/60">Review past interviews and feedback</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                  <History className="w-8 h-8 text-white/60" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10" data-testid="stat-total-interviews">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Total Interviews</p>
                  <p className="text-2xl font-bold text-white">{stats.total_interviews}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10" data-testid="stat-avg-score">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Average Score</p>
                  <p className="text-2xl font-bold text-white">{stats.average_score}/10</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10" data-testid="stat-behavioral">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Behavioral</p>
                  <p className="text-2xl font-bold text-white">{stats.interviews_by_type?.behavioral || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10" data-testid="stat-technical">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Technical</p>
                  <p className="text-2xl font-bold text-white">{stats.interviews_by_type?.technical || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Interviews */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white flex items-center justify-between">
              <span>Recent Interviews</span>
              {recentInterviews.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/history")}
                  className="text-violet-400 hover:text-violet-300"
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentInterviews.length === 0 ? (
              <div className="p-8 text-center" data-testid="no-interviews">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-8 h-8 text-white/40" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No interviews yet</h3>
                <p className="text-white/60 mb-4">Start your first interview to see it here</p>
                <Button
                  onClick={() => navigate("/interview/setup")}
                  className="bg-gradient-to-r from-violet-500 to-purple-600"
                  data-testid="start-first-interview-btn"
                >
                  Start Interview
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {recentInterviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => {
                      if (interview.status === "completed") {
                        navigate(`/interview/${interview.id}/feedback`);
                      } else {
                        navigate(`/interview/${interview.id}`);
                      }
                    }}
                    data-testid={`interview-row-${interview.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{interview.job_role}</h4>
                        <p className="text-sm text-white/60">
                          {interview.interview_type} • {interview.interviewer_mode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                        {interview.status}
                      </span>
                      <span className="text-sm text-white/40">
                        {formatDate(interview.created_at)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-white/40" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
