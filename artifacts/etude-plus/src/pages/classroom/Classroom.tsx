import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, MessageSquare, Users, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";

export function Classroom() {
  const [, params] = useRoute("/classroom/:id");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const participants = [
    { id: 1, name: "Dr. Sami (Hôte)", initials: "ST", role: "host", color: "bg-primary/20 text-primary" },
    { id: 2, name: "Amira B. (Vous)", initials: "AB", role: "you", color: "bg-zinc-800 text-zinc-300" },
    { id: 3, name: "Youssef T.", initials: "YT", role: "student", color: "bg-zinc-800 text-zinc-300" },
    { id: 4, name: "Rym G.", initials: "RG", role: "student", color: "bg-zinc-800 text-zinc-300" },
    { id: 5, name: "Ahmed K.", initials: "AK", role: "student", color: "bg-zinc-800 text-zinc-300" },
  ];

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex flex-col overflow-hidden font-sans">
      {/* Top Bar */}
      <header className="h-16 bg-[#111] border-b border-zinc-800 flex items-center justify-between px-6 shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
            <span className="font-serif font-bold text-primary text-lg">É</span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <Badge className="bg-red-500/10 text-red-500 border-red-500/20 px-2.5 py-0.5 animate-pulse flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                EN DIRECT
              </Badge>
              <h1 className="font-bold text-base tracking-tight">Mathématiques 101: Analyse et Algèbre</h1>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Dr. Sami Trabelsi • 00:45:22</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800">
          <Users className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-300">{participants.length} Participants</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Participants */}
        <aside className="w-72 bg-[#111] border-r border-zinc-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="font-semibold text-sm flex items-center gap-2 text-zinc-200">
              <Users className="w-4 h-4" /> Participants
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {participants.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 hover:bg-zinc-800/50 rounded-lg transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-white/5", p.color)}>
                    {p.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200">{p.name}</span>
                    {p.role === 'host' && <span className="text-[10px] text-primary">Professeur</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MicOff className="w-3.5 h-3.5 text-zinc-500" />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Video Area */}
        <main className="flex-1 p-6 flex flex-col relative bg-black">
          <div className="flex-1 bg-zinc-900/50 rounded-3xl border border-zinc-800/50 relative overflow-hidden flex items-center justify-center shadow-2xl backdrop-blur-sm">
            
            {/* Main Video View */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-4 border-zinc-800 shadow-2xl mb-6">
                <span className="text-5xl text-primary font-bold">ST</span>
              </div>
              <p className="text-xl font-medium text-zinc-300">Dr. Sami Trabelsi</p>
              <p className="text-sm text-zinc-500 mt-1">La caméra est désactivée</p>
            </div>
            
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10 flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-green-400" />
              Dr. Sami
            </div>

            {/* Self View (PiP) */}
            <div className="absolute bottom-6 right-6 w-48 aspect-video bg-zinc-800 rounded-xl border-2 border-zinc-700 shadow-xl overflow-hidden flex flex-col items-center justify-center">
              {isVideoOff ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center mb-2">
                    <span className="text-lg font-bold text-zinc-400">AB</span>
                  </div>
                  <span className="text-xs text-zinc-500">Vous</span>
                </>
              ) : (
                <div className="absolute inset-0 bg-zinc-700 flex items-center justify-center">
                  <Video className="w-8 h-8 text-zinc-500" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-medium">
                Vous {isMuted && <MicOff className="w-3 h-3 text-red-400 inline ml-1" />}
              </div>
            </div>
          </div>
          
          {/* Bottom Controls */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-2.5 rounded-2xl shadow-2xl">
            <Tooltip content={isMuted ? "Activer le micro" : "Désactiver le micro"}>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all", isMuted ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-zinc-800 hover:bg-zinc-700 text-white")}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </Tooltip>
            
            <Tooltip content={isVideoOff ? "Activer la caméra" : "Désactiver la caméra"}>
              <button 
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all", isVideoOff ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-zinc-800 hover:bg-zinc-700 text-white")}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            </Tooltip>
            
            <div className="w-px h-8 bg-zinc-700 mx-2" />
            
            <Tooltip content="Partager l'écran">
              <button className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed">
                <MonitorUp className="w-5 h-5" />
              </button>
            </Tooltip>
            
            <Tooltip content="Tableau blanc">
              <button className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed">
                <PenTool className="w-5 h-5" />
              </button>
            </Tooltip>
            
            <div className="w-px h-8 bg-zinc-700 mx-2" />
            
            <Link href="/student/dashboard">
              <button className="h-12 px-6 rounded-xl bg-red-600 hover:bg-red-500 flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20 font-medium">
                <PhoneOff className="w-5 h-5" />
                Quitter
              </button>
            </Link>
          </div>
        </main>

        {/* Right Sidebar - Chat */}
        <aside className="w-80 bg-[#111] border-l border-zinc-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="font-semibold text-sm flex items-center gap-2 text-zinc-200">
              <MessageSquare className="w-4 h-4" /> Chat de la classe
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="bg-zinc-800/40 border border-zinc-800/50 rounded-xl p-3 text-sm">
              <div className="flex justify-between items-start mb-1.5">
                <p className="text-zinc-400 text-xs font-medium">Amira B.</p>
                <span className="text-[10px] text-zinc-600">14:22</span>
              </div>
              <p className="text-zinc-200">Bonjour monsieur, est-ce qu'on aura un test sur ce chapitre demain ?</p>
            </div>
            
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-sm">
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <p className="text-primary text-xs font-medium">Dr. Sami (Prof)</p>
                </div>
                <span className="text-[10px] text-zinc-500">14:23</span>
              </div>
              <p className="text-zinc-200">Bonjour Amira, le test est prévu pour la semaine prochaine.</p>
            </div>
          </div>
          
          <div className="p-4 border-t border-zinc-800 bg-[#111]">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Envoyer un message..." 
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none placeholder:text-zinc-500 transition-all"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Helpers
function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return <span className={cn("px-2 py-0.5 rounded text-xs font-bold", className)}>{children}</span>
}

function Tooltip({ children, content }: { children: React.ReactNode, content: string }) {
  return (
    <div className="relative group flex flex-col items-center">
      {children}
      <div className="absolute bottom-full mb-2 px-2 py-1 bg-zinc-800 text-xs font-medium text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800" />
      </div>
    </div>
  );
}
