
import React from 'react';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary mb-4 shadow-xl shadow-primary/20 text-white">
            <span className="material-icons-round text-3xl">medical_services</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome Back</h1>
          <p className="text-slate-500 mt-2">Access your personal health assistant</p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 shadow-2xl rounded-[32px] p-8">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1 dark:text-slate-300">Email Address</label>
              <div className="relative">
                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">mail</span>
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2 ml-1">
                <label className="text-sm font-semibold dark:text-slate-300">Password</label>
                <a href="#" className="text-xs font-bold text-primary hover:underline">Forgot?</a>
              </div>
              <div className="relative">
                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">lock</span>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>
            <a href="#/" className="block">
              <button type="button" className="w-full bg-primary hover:bg-teal-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98]">
                Sign In
              </button>
            </a>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-4 text-slate-400 font-bold tracking-widest">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-3.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 transition-colors">
               <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" />
               <span className="text-sm font-bold">Google</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-3.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 transition-colors">
               <span className="material-icons-round text-xl">apple</span>
               <span className="text-sm font-bold">Apple</span>
            </button>
          </div>
        </div>
        
        <p className="text-center mt-8 text-sm text-slate-500">
          Don't have an account? <a href="#/signup" className="font-bold text-secondary hover:underline">Sign up for free</a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
