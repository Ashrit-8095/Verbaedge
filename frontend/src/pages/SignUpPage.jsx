import { SignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Mic, ArrowLeft } from "lucide-react";

const SignUpPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">VerbaEdge</h1>
            <p className="text-white/60 text-sm">Create your account</p>
          </div>
        </div>

        {/* Clerk Sign Up */}
        <div className="clerk-container" data-testid="clerk-signup">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-white/5 border border-white/10 shadow-xl",
                headerTitle: "text-white text-xl",
                headerSubtitle: "text-white/60",
                socialButtonsBlockButton: "bg-white/10 border-white/20 text-white hover:bg-white/20",
                socialButtonsBlockButtonText: "text-white",
                dividerLine: "bg-white/20",
                dividerText: "text-white/40",
                formFieldLabel: "text-white/80",
                formFieldInput: "bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-violet-500",
                formButtonPrimary: "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700",
                footerActionLink: "text-violet-400 hover:text-violet-300",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-violet-400",
                formFieldInputShowPasswordButton: "text-white/60",
                alertText: "text-white/80",
                formFieldWarningText: "text-yellow-400",
                formFieldErrorText: "text-red-400",
              },
              layout: {
                socialButtonsPlacement: "top",
                socialButtonsVariant: "blockButton",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
