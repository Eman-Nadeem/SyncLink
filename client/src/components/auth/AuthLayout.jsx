import { motion } from 'framer-motion';
import { UploadCloud } from 'lucide-react';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-teal-950 via-slate-900 to-blue-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-600/25 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-teal-400/10 blur-[100px] rounded-full"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        className="w-full max-w-[860px] glass-card overflow-hidden flex flex-col md:flex-row bg-slate-900/40 min-h-[500px] md:min-h-0"
      >
        {/* Left Side Info */}
        <div className="w-full md:w-[42%] p-8 md:p-14 flex flex-col justify-between bg-white/[0.01] border-b md:border-b-0 md:border-r border-white/5">
          <div>
            <div className="flex items-center gap-4 mb-12">
              <div className="w-14 h-14 flex items-center justify-center relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="w-full h-full"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]">
                    <defs>
                      <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <motion.stop offset="0%" animate={{ stopColor: ["#1e40af", "#22d3ee", "#1e40af"] }} transition={{ duration: 6, repeat: Infinity }} />
                        <motion.stop offset="100%" animate={{ stopColor: ["#22d3ee", "#1e40af", "#22d3ee"] }} transition={{ duration: 6, repeat: Infinity }} />
                      </linearGradient>
                    </defs>
                    <path d="M35 60 A20 20 0 1 1 55 25" stroke="url(#flowGrad)" strokeWidth="10" fill="none" strokeLinecap="round" />
                    <path d="M65 40 A20 20 0 1 1 45 75" stroke="url(#flowGrad)" strokeWidth="10" fill="none" strokeLinecap="round" />
                  </svg>
                </motion.div>
                {/* Cloud in Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity }}>
                    <UploadCloud className="w-7 h-7 text-white drop-shadow-md" />
                  </motion.div>
                </div>
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-white">Sync<span className="text-teal-400">Link</span></h1>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-8 tracking-tighter">
              Assignment Cloud <br/>
              <span className="bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent italic">Perfected.</span>
            </h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[300px]">
              The ultimate cloud platform for seamless assignment collaboration and grading.
            </p>
          </div>

          <div className="flex justify-center py-6 md:py-12">
             <div className="w-40 h-40 md:w-56 md:h-56 bg-indigo-500/[0.02] rounded-full flex items-center justify-center border border-white/5 shadow-inner relative group">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border border-dashed border-teal-500/20 rounded-full"
                ></motion.div>
                
                <div className="relative flex items-center justify-center">
                   <motion.div 
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1]
                      }}
                      transition={{ duration: 5, repeat: Infinity }}
                      className="absolute w-32 h-32 bg-indigo-500 rounded-full blur-3xl"
                   />
                   <div className="w-32 h-32 relative z-10">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="w-full h-full"
                      >
                        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                          <defs>
                            <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <motion.stop offset="0%" animate={{ stopColor: ["#1e40af", "#22d3ee", "#1e40af"] }} transition={{ duration: 6, repeat: Infinity }} />
                              <motion.stop offset="100%" animate={{ stopColor: ["#22d3ee", "#1e40af", "#22d3ee"] }} transition={{ duration: 6, repeat: Infinity }} />
                            </linearGradient>
                          </defs>
                          <path d="M35 60 A20 20 0 1 1 55 25" stroke="url(#splashGrad)" strokeWidth="8" fill="none" strokeLinecap="round" />
                          <path d="M65 40 A20 20 0 1 1 45 75" stroke="url(#splashGrad)" strokeWidth="8" fill="none" strokeLinecap="round" />
                        </svg>
                      </motion.div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                          <UploadCloud className="w-16 h-16 text-white drop-shadow-2xl" />
                        </motion.div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">ASSIGN • SUBMIT • COLLABORATE • ACHIEVE</p>
            <p className="text-xs font-semibold text-slate-700 tracking-wider">
              SyncLink Cloud © 2026
            </p>
          </div>
        </div>

        {/* Right Side Form Content */}
        <div className="flex-1 p-8 md:p-16 lg:p-20 flex flex-col justify-center">
          <div className="mb-6 md:mb-10">
            <h2 className="text-2xl md:text-4xl font-black mb-3 text-white tracking-tighter">
              {title}
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              {subtitle}
            </p>
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
