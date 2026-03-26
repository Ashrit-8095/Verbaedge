import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, UserButton } from "@clerk/clerk-react";
import { 
  Mic, ArrowLeft, Target, Clock, TrendingUp, 
  Calendar, ArrowRight, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InterviewHistory = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [filteredInterviews, setFilteredInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: "all",
    status: "all"
  });

  useEffect(() => {
    fetchInterviews();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [interviews, filter]);

  const fetchInterviews = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API}/interviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInterviews(response.data);
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...interviews];
    
    if (filter.type !== "all") {
      result = result.filter(i => i.interview_type === filter.type);
    }
    
    if (filter.status !== "all") {
      result = result.filter(i => i.status === filter.status);
    }
    
    setFilteredInterviews(result);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "text-green-400 bg-green-400/10";
      case "in_progress": return "text-yellow-400 bg-yellow-400/10";
      default: return "text-gray-400 bg-gray-400/10";
    }
  };

  const getModeColor = (mode) => {
    switch (mode) {
      case "neutral": return "bg-green-500/20 text-green-400";
      case "strict": return "bg-yellow-500/20 text-yellow-400";
      case "high_pressure": return "bg-red-500/20 text-red-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
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
              <span className="text-xl font-bold">Interview History</span>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-white/60" />
                <span className="text-white/60 text-sm">Filters:</span>
              </div>
              
              <Select
                value={filter.type}
                onValueChange={(value) => setFilter({ ...filter, type: value })}
              >
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white" data-testid="filter-type">
                  <SelectValue placeholder="Interview Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1b] border-white/20">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filter.status}
                onValueChange={(value) => setFilter({ ...filter, status: value })}
              >
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white" data-testid="filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1b] border-white/20">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                </SelectContent>
              </Select>

              <div className="ml-auto text-sm text-white/60">
                {filteredInterviews.length} interview{filteredInterviews.length !== 1 ? "s" : ""}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interview List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-white/60">Loading interviews...</div>
          </div>
        ) : filteredInterviews.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white/40" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No interviews found</h3>
              <p className="text-white/60 mb-4">
                {interviews.length === 0 
                  ? "Start your first interview to see it here"
                  : "No interviews match the selected filters"}
              </p>
              <Button
                onClick={() => navigate("/interview/setup")}
                className="bg-gradient-to-r from-violet-500 to-purple-600"
                data-testid="start-interview-btn"
              >
                Start Interview
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInterviews.map((interview) => (
              <Card
                key={interview.id}
                className="bg-white/5 border-white/10 hover:border-white/20 transition-all cursor-pointer"
                onClick={() => {
                  if (interview.status === "completed") {
                    navigate(`/interview/${interview.id}/feedback`);
                  } else if (interview.status === "in_progress" || interview.status === "created") {
                    navigate(`/interview/${interview.id}`);
                  }
                }}
                data-testid={`interview-card-${interview.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                        <Target className="w-6 h-6 text-violet-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">{interview.job_role}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-white/60 capitalize">
                            {interview.interview_type}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getModeColor(interview.interviewer_mode)}`}>
                            {interview.interviewer_mode?.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {interview.status === "completed" && interview.feedback && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">
                            {interview.feedback.overall_score}
                          </div>
                          <div className="text-xs text-white/40">Score</div>
                        </div>
                      )}
                      
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                          {interview.status}
                        </span>
                        <div className="flex items-center gap-1 mt-2 text-xs text-white/40">
                          <Calendar className="w-3 h-3" />
                          {formatDate(interview.created_at)}
                        </div>
                      </div>
                      
                      <ArrowRight className="w-5 h-5 text-white/40" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default InterviewHistory;
