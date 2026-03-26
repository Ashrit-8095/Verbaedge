import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { 
  Mic, MicOff, Phone, PhoneOff, Clock, AlertCircle,
  Volume2, VolumeX, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import Vapi from "@vapi-ai/web";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const VAPI_PUBLIC_KEY = process.env.REACT_APP_VAPI_PUBLIC_KEY;

const InterviewSession = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Call state
  const [callStatus, setCallStatus] = useState("idle"); // idle, connecting, active, ended
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  
  const vapiRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchInterview();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch (e) {
          console.log("Vapi cleanup");
        }
      }
    };
  }, [interviewId]);

  const fetchInterview = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API}/interviews/${interviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInterview(response.data);
      
      if (response.data.status === "completed") {
        navigate(`/interview/${interviewId}/feedback`);
      }
    } catch (err) {
      setError("Failed to load interview");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initializeVapi = () => {
    if (!VAPI_PUBLIC_KEY) {
      setError("Voice service not configured");
      return null;
    }

    const vapi = new Vapi(VAPI_PUBLIC_KEY);

    vapi.on("call-start", () => {
      console.log("Call started");
      setCallStatus("active");
      startTimer();
    });

    vapi.on("call-end", () => {
      console.log("Call ended");
      setCallStatus("ended");
      stopTimer();
    });

    vapi.on("speech-start", () => {
      setCurrentSpeaker("assistant");
    });

    vapi.on("speech-end", () => {
      setCurrentSpeaker(null);
    });

    vapi.on("message", (message) => {
      if (message.type === "transcript") {
        const role = message.role === "user" ? "candidate" : "interviewer";
        setTranscript(prev => [...prev, {
          role,
          content: message.transcript,
          timestamp: new Date().toISOString()
        }]);
      }
    });

    vapi.on("error", (error) => {
      console.error("Vapi error:", error);
      setError("Voice connection error. Please try again.");
      setCallStatus("idle");
    });

    return vapi;
  };

  const startCall = async () => {
    setCallStatus("connecting");
    setError(null);

    try {
      // Start the interview on backend
      const token = await getToken();
      await axios.post(
        `${API}/interviews/${interviewId}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Initialize Vapi
      const vapi = initializeVapi();
      if (!vapi) return;
      
      vapiRef.current = vapi;

      // Create assistant config for the interview
      const assistantConfig = {
        name: `VerbaEdge Interview - ${interview.job_role}`,
        model: {
          provider: "openai",
          model: "gpt-4",
          systemPrompt: getSystemPrompt()
        },
        voice: {
          provider: "11labs",
          voiceId: "21m00Tcm4TlvDq8ikWAM"
        },
        firstMessage: `Hello! Welcome to your ${interview.interview_type} interview for the ${interview.job_role} position. I'll be your AI interviewer today. Before we begin, could you please introduce yourself and tell me a bit about your background?`
      };

      // Start the call with transient assistant
      await vapi.start({
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en"
        },
        model: assistantConfig.model,
        voice: assistantConfig.voice,
        firstMessage: assistantConfig.firstMessage
      });

    } catch (err) {
      console.error("Error starting call:", err);
      setError("Failed to start interview. Please try again.");
      setCallStatus("idle");
    }
  };

  const endCall = async () => {
    if (vapiRef.current) {
      try {
        vapiRef.current.stop();
      } catch (e) {
        console.log("Error stopping Vapi:", e);
      }
    }
    
    stopTimer();
    setCallStatus("ended");

    // Complete the interview
    try {
      const token = await getToken();
      await axios.post(
        `${API}/interviews/${interviewId}/complete`,
        {
          transcript,
          duration_seconds: duration
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Navigate to feedback page
      setTimeout(() => {
        navigate(`/interview/${interviewId}/feedback`);
      }, 1500);

    } catch (err) {
      console.error("Error completing interview:", err);
      setError("Failed to save interview. Your data may not be saved.");
    }
  };

  const toggleMute = () => {
    if (vapiRef.current) {
      vapiRef.current.setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const getSystemPrompt = () => {
    const basePrompt = `You are an AI interviewer conducting a ${interview.interview_type} interview for a ${interview.job_role} position.

Your task is to:
1. Ask relevant interview questions one at a time
2. Listen carefully to the candidate's responses
3. Ask follow-up questions when appropriate
4. Provide a professional interview experience

Interview Guidelines:
- Ask about the candidate's background first
- Progress to role-specific questions
- End with asking if the candidate has any questions`;

    const modePrompts = {
      neutral: `
Be friendly and encouraging. Maintain a balanced pace and provide positive acknowledgments.`,
      strict: `
Be direct and to the point. Probe deeper into answers, challenge vague responses, and ask for specific examples.`,
      high_pressure: `
Create a challenging environment. Ask rapid-fire follow-up questions, challenge assumptions, and test how the candidate handles stress.`
    };

    return basePrompt + (modePrompts[interview.interviewer_mode] || modePrompts.neutral);
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white">{error}</p>
          <Button
            onClick={() => navigate("/dashboard")}
            className="mt-4"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f10] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{interview?.job_role}</h1>
            <p className="text-white/60 text-sm">
              {interview?.interview_type} • {interview?.interviewer_mode?.replace("_", " ")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
              <Clock className="w-4 h-4 text-white/60" />
              <span className="font-mono text-lg">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Call Status Visualization */}
        <div className="mb-8">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center relative ${
            callStatus === "active" 
              ? "bg-gradient-to-br from-violet-500 to-purple-600" 
              : callStatus === "connecting"
              ? "bg-yellow-500/20 border-2 border-yellow-500"
              : "bg-white/10"
          }`}>
            {callStatus === "connecting" ? (
              <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
            ) : callStatus === "active" ? (
              <>
                <Mic className={`w-12 h-12 ${currentSpeaker === "assistant" ? "animate-pulse" : ""}`} />
                {currentSpeaker === "assistant" && (
                  <div className="absolute inset-0 rounded-full border-4 border-violet-400 animate-ping" />
                )}
              </>
            ) : callStatus === "ended" ? (
              <PhoneOff className="w-12 h-12 text-white/60" />
            ) : (
              <Mic className="w-12 h-12 text-white/40" />
            )}
          </div>
        </div>

        {/* Status Text */}
        <p className="text-lg text-white/60 mb-8" data-testid="call-status">
          {callStatus === "idle" && "Ready to start your interview"}
          {callStatus === "connecting" && "Connecting to your AI interviewer..."}
          {callStatus === "active" && (currentSpeaker === "assistant" ? "AI is speaking..." : "Listening...")}
          {callStatus === "ended" && "Interview completed. Preparing feedback..."}
        </p>

        {/* Error Display */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Call Controls */}
        <div className="flex items-center gap-4">
          {callStatus === "idle" && (
            <Button
              size="lg"
              onClick={startCall}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-8"
              data-testid="start-call-btn"
            >
              <Phone className="w-5 h-5 mr-2" />
              Start Interview
            </Button>
          )}

          {callStatus === "active" && (
            <>
              <Button
                size="lg"
                variant="outline"
                onClick={toggleMute}
                className={`${isMuted ? "bg-red-500/20 border-red-500" : "bg-white/10 border-white/20"}`}
                data-testid="mute-btn"
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>

              <Button
                size="lg"
                onClick={endCall}
                className="bg-red-500 hover:bg-red-600 px-8"
                data-testid="end-call-btn"
              >
                <PhoneOff className="w-5 h-5 mr-2" />
                End Interview
              </Button>
            </>
          )}

          {callStatus === "ended" && (
            <div className="flex items-center gap-2 text-violet-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating feedback...
            </div>
          )}
        </div>

        {/* Live Transcript */}
        {transcript.length > 0 && (
          <Card className="w-full max-w-2xl mt-8 bg-white/5 border-white/10">
            <CardContent className="p-4 max-h-64 overflow-y-auto">
              <h3 className="text-sm font-semibold text-white/60 mb-3">Live Transcript</h3>
              <div className="space-y-3">
                {transcript.slice(-5).map((msg, idx) => (
                  <div key={idx} className="text-sm">
                    <span className={`font-semibold ${
                      msg.role === "interviewer" ? "text-violet-400" : "text-green-400"
                    }`}>
                      {msg.role === "interviewer" ? "Interviewer" : "You"}:
                    </span>
                    <span className="text-white/80 ml-2">{msg.content}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Tips Footer */}
      {callStatus === "idle" && (
        <footer className="border-t border-white/10 p-6">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-sm font-semibold text-white/60 mb-2">Tips for your interview:</h3>
            <ul className="text-sm text-white/40 space-y-1">
              <li>• Speak clearly and at a natural pace</li>
              <li>• Use specific examples from your experience</li>
              <li>• Take a moment to think before answering</li>
              <li>• Stay calm and confident throughout</li>
            </ul>
          </div>
        </footer>
      )}
    </div>
  );
};

export default InterviewSession;
