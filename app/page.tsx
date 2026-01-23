import React, { useState } from "react";
import { Button } from "../components/ui/Button";
import { DoctorWidget } from "../components/widget/DoctorWidget";
import { removeAuthCookies } from "@/lib/helper/token";
import { useNavigate } from "react-router-dom";
import { isLogin } from "../lib/helper";
const HomePage: React.FC = () => {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      removeAuthCookies();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-effect border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                <span className="material-icons-round">health_and_safety</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Docter AI
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="/"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Home
              </a>
              <a
                href="/chat"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                ChatAI
              </a>
              <a
                href="/support"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Support
              </a>
              <button
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() =>
                  document.documentElement.classList.toggle("dark")
                }
              >
                <span className="material-icons-round dark:hidden">
                  dark_mode
                </span>
                <span className="material-icons-round hidden dark:block">
                  light_mode
                </span>
              </button>
              {isLogin() ? (
                <button
                  onClick={handleLogout}
                  className="bg-primary/10 text-primary hover:bg-primary hover:text-white
               px-6 py-2.5 rounded-full font-semibold transition-all
               shadow-lg shadow-primary/10"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="bg-primary hover:bg-teal-700 text-white
               px-6 py-2.5 rounded-full font-semibold transition-all
               shadow-lg shadow-teal-700/20"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-l from-teal-50 to-transparent dark:from-teal-900/10 dark:to-transparent opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary dark:bg-primary/20 font-semibold text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Next-Gen Medical Assistance
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 dark:text-white leading-[1.1]">
                Your AI <span className="text-primary">Health</span> Companion.
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                Experience immediate medical guidance, symptom checks, and
                medication info powered by advanced AI.
              </p>
              <div className="flex flex-wrap gap-4">
                <a href="#/chat">
                  <Button size="lg" className="px-10">
                    Get Started Free{" "}
                    <span className="material-icons-round ml-2">
                      arrow_forward
                    </span>
                  </Button>
                </a>
                <Button variant="outline" size="lg" className="px-10">
                  <span className="material-icons-round text-primary mr-2">
                    play_circle
                  </span>{" "}
                  Watch Demo
                </Button>
              </div>
            </div>

            <div className="relative hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden transform rotate-2 z-10 floating">
                <div className="p-6 bg-primary text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://picsum.photos/seed/doc/100/100"
                      className="w-10 h-10 rounded-full border-2 border-white/20"
                      alt=""
                    />
                    <div>
                      <h4 className="font-bold text-sm">Doctor AI</h4>
                      <p className="text-[10px] opacity-70">
                        Medical Assistant
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-2xl rounded-tl-none mr-12 text-sm">
                    Hi! How can I assist you today ?
                  </div>
                  <div className="bg-primary/10 p-4 rounded-2xl rounded-tr-none ml-12 text-sm text-primary dark:text-teal-400">
                    I've been feeling some fatigue.
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-2xl rounded-tl-none mr-12 text-sm italic opacity-60">
                    Analyzing symptoms...
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-0"></div>
              <div className="absolute -bottom-10 -left-10 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 z-20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl">
                    <span className="material-icons-round">verified</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Accuracy Rate</p>
                    <p className="text-xl font-bold dark:text-white">98.4%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-24 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4 dark:text-white">
            Smart Healthcare Solutions
          </h2>
          <p className="text-slate-500 mb-16 max-w-2xl mx-auto">
            Trained on millions of clinical papers to provide accurate health
            information.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "chat",
                title: "Instant Consultation",
                desc: "Chat with our AI anytime for immediate answers.",
              },
              {
                icon: "mic",
                title: "Voice Interaction",
                desc: "Speak naturally for hands-free guidance.",
              },
              {
                icon: "history",
                title: "Health Tracking",
                desc: "Securely store and track your history.",
              },
            ].map((sol, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-primary transition-all group bg-white dark:bg-slate-900 shadow-sm"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-icons-round">{sol.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-4 dark:text-white">
                  {sol.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {sol.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Action Button */}
      {!isWidgetOpen && (
        <div className="fixed bottom-8 right-8 z-[60]">
          <button
            onClick={() => setIsWidgetOpen(true)}
            className="group flex items-center gap-3 bg-primary text-white pl-4 pr-6 py-4 rounded-full shadow-2xl shadow-primary/40 hover:scale-105 transition-all"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="material-icons-round">chat</span>
            </div>
            <span className="font-bold">Chat with AI</span>
          </button>
        </div>
      )}

      {/* Pop-up Widget */}
      {isWidgetOpen && <DoctorWidget onClose={() => setIsWidgetOpen(false)} />}
    </div>
  );
};

export default HomePage;
