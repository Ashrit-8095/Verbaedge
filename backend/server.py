from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="VerbaEdge API", description="Voice-Based AI Interview Simulation Platform")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables
VAPI_PRIVATE_KEY = os.environ.get('VAPI_PRIVATE_KEY', '')
VAPI_PUBLIC_KEY = os.environ.get('VAPI_PUBLIC_KEY', '')
CLERK_SECRET_KEY = os.environ.get('CLERK_SECRET_KEY', '')
CLERK_PUBLISHABLE_KEY = os.environ.get('CLERK_PUBLISHABLE_KEY', '')

# =========================
# Pydantic Models
# =========================

class InterviewCreate(BaseModel):
    job_role: str
    interview_type: str  # behavioral, technical, mixed
    interviewer_mode: str  # neutral, strict, high_pressure
    difficulty: str = "medium"

class InterviewResponse(BaseModel):
    id: str
    user_id: str
    job_role: str
    interview_type: str
    interviewer_mode: str
    difficulty: str
    status: str
    created_at: str
    vapi_assistant_id: Optional[str] = None

class InterviewComplete(BaseModel):
    transcript: List[dict]
    duration_seconds: int

class FeedbackResponse(BaseModel):
    interview_id: str
    overall_score: float
    communication_score: float
    technical_score: float
    confidence_score: float
    strengths: List[str]
    improvements: List[str]
    detailed_feedback: str

class UserProfile(BaseModel):
    user_id: str
    email: Optional[str] = None
    name: Optional[str] = None
    total_interviews: int = 0
    average_score: float = 0.0

# =========================
# Helper Functions
# =========================

async def verify_clerk_token(request: Request) -> dict:
    """Verify Clerk session token from Authorization header"""
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = auth_header.replace('Bearer ', '')
    
    try:
        # For Clerk, we verify the session token
        # In production, use Clerk's JWKS endpoint for verification
        # For now, decode without verification for development
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get('sub')
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: no user ID")
        
        return {"user_id": user_id, "token_data": decoded}
    except jwt.InvalidTokenError as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

def get_interviewer_prompt(mode: str, job_role: str, interview_type: str) -> str:
    """Generate system prompt based on interviewer mode"""
    
    base_prompt = f"""You are an AI interviewer conducting a {interview_type} interview for a {job_role} position. 
    
Your task is to:
1. Ask relevant interview questions one at a time
2. Listen carefully to the candidate's responses
3. Ask follow-up questions when appropriate
4. Provide a professional interview experience

Interview Guidelines:
- Start with a brief introduction
- Ask about the candidate's background first
- Progress to role-specific questions
- End with asking if the candidate has any questions
"""

    mode_prompts = {
        "neutral": """
Interviewer Style: NEUTRAL & PROFESSIONAL
- Be friendly and encouraging
- Maintain a balanced pace
- Provide positive acknowledgments
- Keep the atmosphere comfortable
""",
        "strict": """
Interviewer Style: STRICT & DETAILED
- Be direct and to the point
- Probe deeper into answers
- Challenge vague responses
- Maintain high expectations
- Ask for specific examples and metrics
""",
        "high_pressure": """
Interviewer Style: HIGH PRESSURE
- Create a challenging environment
- Ask rapid-fire follow-up questions
- Challenge assumptions in responses
- Test how the candidate handles stress
- Interrupt occasionally to simulate real pressure
- Push for concrete answers
"""
    }
    
    return base_prompt + mode_prompts.get(mode, mode_prompts["neutral"])

async def create_vapi_assistant(interview: dict) -> str:
    """Create a Vapi assistant for the interview"""
    
    system_prompt = get_interviewer_prompt(
        interview['interviewer_mode'],
        interview['job_role'],
        interview['interview_type']
    )
    
    # Return a mock assistant ID for now
    # In production, this would call Vapi's API to create an assistant
    assistant_config = {
        "name": f"VerbaEdge Interviewer - {interview['job_role']}",
        "model": {
            "provider": "openai",
            "model": "gpt-4",
            "systemPrompt": system_prompt
        },
        "voice": {
            "provider": "11labs",
            "voiceId": "21m00Tcm4TlvDq8ikWAM"  # Professional male voice
        },
        "firstMessage": f"Hello! Welcome to your {interview['interview_type']} interview for the {interview['job_role']} position. I'm your AI interviewer today. Before we begin, could you please introduce yourself and tell me a bit about your background?"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.vapi.ai/assistant",
                headers={
                    "Authorization": f"Bearer {VAPI_PRIVATE_KEY}",
                    "Content-Type": "application/json"
                },
                json=assistant_config,
                timeout=30.0
            )
            
            if response.status_code == 201:
                data = response.json()
                return data.get('id', str(uuid.uuid4()))
            else:
                logger.warning(f"Vapi assistant creation failed: {response.status_code}")
                return str(uuid.uuid4())  # Return mock ID on failure
                
    except Exception as e:
        logger.error(f"Error creating Vapi assistant: {e}")
        return str(uuid.uuid4())  # Return mock ID on error

def generate_feedback(transcript: List[dict], interview: dict) -> dict:
    """Generate feedback based on interview transcript"""
    
    # Analyze transcript length and content
    candidate_responses = [msg for msg in transcript if msg.get('role') == 'user']
    total_words = sum(len(msg.get('content', '').split()) for msg in candidate_responses)
    avg_response_length = total_words / max(len(candidate_responses), 1)
    
    # Generate scores based on simple heuristics
    # In production, this would use AI analysis
    communication_score = min(10, 5 + (avg_response_length / 20))
    technical_score = min(10, 5 + (len(candidate_responses) / 5))
    confidence_score = min(10, 6 + (avg_response_length / 30))
    overall_score = (communication_score + technical_score + confidence_score) / 3
    
    strengths = []
    improvements = []
    
    if avg_response_length > 30:
        strengths.append("Provided detailed and comprehensive responses")
    else:
        improvements.append("Consider providing more detailed responses with examples")
    
    if len(candidate_responses) > 5:
        strengths.append("Engaged well throughout the interview")
    
    if communication_score > 7:
        strengths.append("Clear and articulate communication")
    else:
        improvements.append("Work on structuring responses more clearly")
    
    if not strengths:
        strengths.append("Completed the interview session")
    
    if not improvements:
        improvements.append("Continue practicing to maintain skills")
    
    return {
        "overall_score": round(overall_score, 1),
        "communication_score": round(communication_score, 1),
        "technical_score": round(technical_score, 1),
        "confidence_score": round(confidence_score, 1),
        "strengths": strengths,
        "improvements": improvements,
        "detailed_feedback": f"You completed a {interview['interview_type']} interview for the {interview['job_role']} position in {interview['interviewer_mode']} mode. Your overall performance score is {round(overall_score, 1)}/10."
    }

# =========================
# API Routes
# =========================

@api_router.get("/")
async def root():
    return {"message": "VerbaEdge API - Voice-Based AI Interview Simulation Platform"}

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "vapi_configured": bool(VAPI_PRIVATE_KEY),
        "clerk_configured": bool(CLERK_SECRET_KEY)
    }

@api_router.get("/config")
async def get_config():
    """Get public configuration for frontend"""
    return {
        "vapi_public_key": VAPI_PUBLIC_KEY,
        "clerk_publishable_key": CLERK_PUBLISHABLE_KEY
    }

# =========================
# Interview Routes
# =========================

@api_router.post("/interviews", response_model=InterviewResponse)
async def create_interview(
    interview_data: InterviewCreate,
    auth: dict = Depends(verify_clerk_token)
):
    """Create a new interview session"""
    
    interview_id = str(uuid.uuid4())
    user_id = auth['user_id']
    
    interview_doc = {
        "id": interview_id,
        "user_id": user_id,
        "job_role": interview_data.job_role,
        "interview_type": interview_data.interview_type,
        "interviewer_mode": interview_data.interviewer_mode,
        "difficulty": interview_data.difficulty,
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "vapi_assistant_id": None,
        "transcript": [],
        "feedback": None,
        "completed_at": None
    }
    
    # Create Vapi assistant
    assistant_id = await create_vapi_assistant(interview_doc)
    interview_doc["vapi_assistant_id"] = assistant_id
    
    # Store in MongoDB
    await db.interviews.insert_one(interview_doc)
    
    logger.info(f"Created interview {interview_id} for user {user_id}")
    
    return InterviewResponse(
        id=interview_id,
        user_id=user_id,
        job_role=interview_data.job_role,
        interview_type=interview_data.interview_type,
        interviewer_mode=interview_data.interviewer_mode,
        difficulty=interview_data.difficulty,
        status="created",
        created_at=interview_doc["created_at"],
        vapi_assistant_id=assistant_id
    )

@api_router.get("/interviews", response_model=List[InterviewResponse])
async def get_interviews(auth: dict = Depends(verify_clerk_token)):
    """Get all interviews for the authenticated user"""
    
    user_id = auth['user_id']
    interviews = await db.interviews.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [InterviewResponse(**interview) for interview in interviews]

@api_router.get("/interviews/{interview_id}", response_model=InterviewResponse)
async def get_interview(
    interview_id: str,
    auth: dict = Depends(verify_clerk_token)
):
    """Get a specific interview"""
    
    interview = await db.interviews.find_one(
        {"id": interview_id, "user_id": auth['user_id']},
        {"_id": 0}
    )
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    return InterviewResponse(**interview)

@api_router.post("/interviews/{interview_id}/start")
async def start_interview(
    interview_id: str,
    auth: dict = Depends(verify_clerk_token)
):
    """Start an interview session"""
    
    interview = await db.interviews.find_one(
        {"id": interview_id, "user_id": auth['user_id']}
    )
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    await db.interviews.update_one(
        {"id": interview_id},
        {"$set": {"status": "in_progress", "started_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "message": "Interview started",
        "interview_id": interview_id,
        "vapi_assistant_id": interview.get("vapi_assistant_id")
    }

@api_router.post("/interviews/{interview_id}/complete")
async def complete_interview(
    interview_id: str,
    data: InterviewComplete,
    auth: dict = Depends(verify_clerk_token)
):
    """Complete an interview and generate feedback"""
    
    interview = await db.interviews.find_one(
        {"id": interview_id, "user_id": auth['user_id']}
    )
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Generate feedback
    feedback = generate_feedback(data.transcript, interview)
    
    # Update interview
    await db.interviews.update_one(
        {"id": interview_id},
        {
            "$set": {
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "transcript": data.transcript,
                "duration_seconds": data.duration_seconds,
                "feedback": feedback
            }
        }
    )
    
    # Update user stats
    await update_user_stats(auth['user_id'], feedback['overall_score'])
    
    return {
        "message": "Interview completed",
        "interview_id": interview_id,
        "feedback": feedback
    }

@api_router.get("/interviews/{interview_id}/feedback", response_model=FeedbackResponse)
async def get_interview_feedback(
    interview_id: str,
    auth: dict = Depends(verify_clerk_token)
):
    """Get feedback for a completed interview"""
    
    interview = await db.interviews.find_one(
        {"id": interview_id, "user_id": auth['user_id']},
        {"_id": 0}
    )
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    if not interview.get('feedback'):
        raise HTTPException(status_code=400, detail="Interview not completed yet")
    
    feedback = interview['feedback']
    return FeedbackResponse(
        interview_id=interview_id,
        **feedback
    )

# =========================
# User Profile Routes
# =========================

async def update_user_stats(user_id: str, new_score: float):
    """Update user statistics after completing an interview"""
    
    user = await db.users.find_one({"user_id": user_id})
    
    if user:
        total = user.get('total_interviews', 0)
        avg = user.get('average_score', 0)
        new_total = total + 1
        new_avg = ((avg * total) + new_score) / new_total
        
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"total_interviews": new_total, "average_score": round(new_avg, 1)}}
        )
    else:
        await db.users.insert_one({
            "user_id": user_id,
            "total_interviews": 1,
            "average_score": new_score,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

@api_router.get("/user/profile", response_model=UserProfile)
async def get_user_profile(auth: dict = Depends(verify_clerk_token)):
    """Get user profile and statistics"""
    
    user_id = auth['user_id']
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    if not user:
        # Create new user profile
        user = {
            "user_id": user_id,
            "total_interviews": 0,
            "average_score": 0.0
        }
        await db.users.insert_one({**user, "created_at": datetime.now(timezone.utc).isoformat()})
    
    return UserProfile(**user)

@api_router.get("/user/stats")
async def get_user_stats(auth: dict = Depends(verify_clerk_token)):
    """Get detailed user statistics"""
    
    user_id = auth['user_id']
    
    # Get all completed interviews
    interviews = await db.interviews.find(
        {"user_id": user_id, "status": "completed"},
        {"_id": 0}
    ).to_list(100)
    
    if not interviews:
        return {
            "total_interviews": 0,
            "average_score": 0,
            "interviews_by_type": {},
            "recent_scores": []
        }
    
    # Calculate stats
    scores = [i.get('feedback', {}).get('overall_score', 0) for i in interviews]
    types = {}
    for i in interviews:
        t = i.get('interview_type', 'unknown')
        types[t] = types.get(t, 0) + 1
    
    return {
        "total_interviews": len(interviews),
        "average_score": round(sum(scores) / len(scores), 1),
        "interviews_by_type": types,
        "recent_scores": scores[-10:]  # Last 10 scores
    }

# =========================
# Vapi Webhook Handler
# =========================

@api_router.post("/webhooks/vapi")
async def handle_vapi_webhook(request: Request):
    """Handle Vapi webhook events"""
    
    try:
        body = await request.json()
        event_type = body.get('type', '')
        
        logger.info(f"Received Vapi webhook: {event_type}")
        
        if event_type == 'call-started':
            call_id = body.get('call', {}).get('id')
            logger.info(f"Call started: {call_id}")
            
        elif event_type == 'call-ended':
            call_id = body.get('call', {}).get('id')
            logger.info(f"Call ended: {call_id}")
            
        elif event_type == 'transcript':
            transcript = body.get('transcript', '')
            logger.info(f"Transcript received: {transcript[:100]}...")
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
