
import React from 'react';
// Added missing import for Button component
import { Button } from '../../components/ui/Button';

const SignupPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden grid md:grid-cols-2">
        {/* Left Side */}
        <div className="hidden md:flex flex-col justify-between p-16 bg-primary relative overflow-hidden">
          <div className="z-10">
            <div className="flex items-center space-x-2 text-white mb-12">
              <span className="material-icons-round text-3xl">medical_services</span>
              <span className="text-2xl font-bold">HealthAI</span>
            </div>
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-8">
              Your Personal Health Companion, Reimagined.
            </h1>
            <p className="text-teal-50 text-xl opacity-90 leading-relaxed">
              Join thousands of users getting reliable medical guidance, symptom checks, and medication support instantly.
            </p>
          </div>
          
          <div className="z-10 bg-white/10 p-6 rounded-3xl border border-white/20">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                 <span className="material-icons-round">verified_user</span>
               </div>
               <div>
                 <p className="font-bold text-white">HIPAA Compliant</p>
                 <p className="text-teal-50 text-sm opacity-80">Your medical data is encrypted and secure.</p>
               </div>
            </div>
          </div>

          {/* Decorations */}
          <div className="absolute top-20 right-0 w-64 h-64 bg-teal-400/20 rounded-full blur-[100px]"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-secondary/20 rounded-full blur-[100px]"></div>
        </div>

        {/* Right Side */}
        <div className="p-10 md:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Create Account</h2>
            <p className="text-slate-500">Start your journey to better health today.</p>
          </div>

          <form className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2 ml-1 dark:text-slate-300">Full Name</label>
              <input 
                type="text" 
                placeholder="Dr. John Doe" 
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 ml-1 dark:text-slate-300">Email Address</label>
              <input 
                type="email" 
                placeholder="john@example.com" 
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 ml-1 dark:text-slate-300">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all"
              />
              <p className="mt-2 text-[10px] text-slate-400 px-1">At least 8 characters with a mix of letters and numbers.</p>
            </div>

            <div className="flex items-start space-x-3 py-2">
              <input type="checkbox" className="mt-1 rounded text-primary focus:ring-primary w-5 h-5 border-slate-200" />
              <label className="text-sm text-slate-500">
                I agree to the <a href="#" className="font-bold text-primary">Terms</a> and <a href="#" className="font-bold text-primary">Privacy Policy</a>.
              </label>
            </div>

            <Button className="w-full py-4 text-lg">Create Account <span className="material-icons-round ml-2">arrow_forward</span></Button>
          </form>

          <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
             <p className="text-slate-500 font-medium">
               Already have an account? <a href="#/login" className="font-bold text-secondary hover:underline">Sign In</a>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;