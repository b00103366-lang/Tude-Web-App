import { useState, useEffect, useRef } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, MessageSquare, Users, PenTool, AlertCircle, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

type SessionData = {
  session: { id: number; classId: number; title: string; description?: string | null; status: string; scheduledAt: string; durationHours: number; price: number };
  class: { id: number; title: string; subject: string; gradeLevel: string } | null;
  professor: { fullName: string; id: number } | null;
  students: { id: number; fullName: string; email: string }[];
};

type ChatMsg = { id: number; sender: string; text: string; time: string; isMe: boolean };

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("px-2 py-0.5 rounded text-xs font-bold", className)}>{children}</span>;
}

function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
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

export function Classroom() {
  const [, params] = useRoute("/classroom/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const sessionId = params?.id ? parseInt(params.id) : 0;

  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) { setError("Session invalide."); setLoading(false); return; }
    const token = localStorage.getItem("etude_auth_token");
    fetch(`/api/classes/sessions/${sessionId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => { if (!r.ok) throw new Error("Session introuvable"); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [sessionId]);

  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const timerStr = `${pad(Math.floor(elapsed / 3600))}:${pad(Math.floor((elapsed % 3600) / 60))}:${pad(elapsed % 60)}`;

  const handleExit = () => {
    if (user?.role === "professor") setLocation("/professor/dashboard");
    else setLocation("/student/dashboard");
  };

  const sendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    const now = new Date();
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: user?.fullName ?? "Vous",
      text,
      time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
      isMe: true,
    }]);
    setChatInput("");
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-zinc-400">Connexion à la salle...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center text-white max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Session introuvable</h2>
          <p className="text-zinc-400 mb-6">{error || "Cette session n'existe pas ou n'est plus disponible."}</p>
          <button onClick={handleExit} className="px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors">
            Retourner au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  const { session, professor, students } = data;
  const profName = professor?.fullName ?? "Professeur";
  const profInitials = initials(profName);
  const myName = user?.fullName ?? "Vous";
  const myInitials = initials(myName);
  const isProfessor = user?.role === "professor";

  const participantsList = [
    { id: 0, name: `${profName} (Hôte)`, initials: profInitials, role: "host" as const },
    ...students.map(s => ({
      id: s.id,
      name: s.id === user?.id ? `${s.fullName} (Vous)` : s.fullName,
      initials: initials(s.fullName),
      role: (s.id === user?.id ? "you" : "student") as "you" | "student",
    })),
    ...(isProfessor ? [] : user ? [{ id: -1, name: `${myName} (Vous)`, initials: myInitials, role: "you" as const }] : []),
  ];
  const uniqueParticipants = Array.from(new Map(participantsList.map(p => [p.id === user?.id && p.role === "you" ? "me" : p.id, p])).values());

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex flex-col overflow-hidden font-sans">
      {/* Top Bar */}
      <header className="h-16 bg-[#111] border-b border-zinc-800 flex items-center justify-between px-6 shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 hover:bg-primary/30 transition-colors">
            <span className="font-serif font-bold text-primary text-lg">É</span>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-0.5 animate-pulse flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                EN DIRECT
              </Badge>
              <h1 className="font-bold text-base tracking-tight">{session.title}</h1>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{profName} • {timerStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800">
          <Users className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-300">{uniqueParticipants.length} Participant{uniqueParticipants.length !== 1 ? "s" : ""}</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar – Participants */}
        <aside className="w-64 bg-[#111] border-r border-zinc-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="font-semibold text-sm flex items-center gap-2 text-zinc-200">
              <Users className="w-4 h-4" /> Participants ({uniqueParticipants.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {uniqueParticipants.map(p => (
              <div key={`${p.role}-${p.id}`} className="flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ring-1 ring-white/5", p.role === "host" ? "bg-primary/20 text-primary" : "bg-zinc-800 text-zinc-300")}>
                  {p.initials}
                </div>
                <div>
                  <span className="text-sm font-medium text-zinc-200 block">{p.name}</span>
                  {p.role === "host" && <span className="text-[10px] text-primary">Professeur</span>}
                </div>
              </div>
            ))}
            {uniqueParticipants.length === 1 && (
              <p className="text-xs text-zinc-600 text-center px-4 py-6">En attente d'autres participants...</p>
            )}
          </div>
        </aside>

        {/* Video Area */}
        <main className="flex-1 p-6 flex flex-col relative bg-black">
          <div className="flex-1 bg-zinc-900/50 rounded-3xl border border-zinc-800/50 relative overflow-hidden flex items-center justify-center shadow-2xl backdrop-blur-sm">
            {/* Host video */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-4 border-zinc-800 shadow-2xl mb-6">
                <span className="text-5xl text-primary font-bold">{profInitials}</span>
              </div>
              <p className="text-xl font-medium text-zinc-300">{profName}</p>
              <p className="text-sm text-zinc-500 mt-1">La caméra est désactivée</p>
            </div>
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10 flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-green-400" />
              {profInitials}
            </div>

            {/* Self PiP */}
            <div className="absolute bottom-6 right-6 w-48 aspect-video bg-zinc-800 rounded-xl border-2 border-zinc-700 shadow-xl overflow-hidden flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-zinc-700 flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-zinc-600 flex items-center justify-center">
                  <span className="text-lg font-bold text-zinc-300">{myInitials}</span>
                </div>
                {isVideoOff && <span className="text-xs text-zinc-500">Caméra désactivée</span>}
              </div>
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1">
                Vous {isMuted && <MicOff className="w-3 h-3 text-red-400" />}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-2.5 rounded-2xl shadow-2xl">
            <Tooltip content={isMuted ? "Activer le micro" : "Désactiver le micro"}>
              <button onClick={() => setIsMuted(m => !m)} className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all", isMuted ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-zinc-800 hover:bg-zinc-700 text-white")}>
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </Tooltip>
            <Tooltip content={isVideoOff ? "Activer la caméra" : "Désactiver la caméra"}>
              <button onClick={() => setIsVideoOff(v => !v)} className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all", isVideoOff ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-zinc-800 hover:bg-zinc-700 text-white")}>
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            </Tooltip>
            <div className="w-px h-8 bg-zinc-700 mx-2" />
            <Tooltip content="Partager l'écran">
              <button className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors text-white">
                <MonitorUp className="w-5 h-5" />
              </button>
            </Tooltip>
            <Tooltip content="Tableau blanc">
              <button className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors text-white">
                <PenTool className="w-5 h-5" />
              </button>
            </Tooltip>
            <div className="w-px h-8 bg-zinc-700 mx-2" />
            <Tooltip content="Quitter la session">
              <button onClick={handleExit} className="h-12 px-6 rounded-xl bg-red-600 hover:bg-red-500 flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20 font-medium">
                <PhoneOff className="w-5 h-5" /> Quitter
              </button>
            </Tooltip>
          </div>
        </main>

        {/* Right Sidebar – Chat */}
        <aside className="w-80 bg-[#111] border-l border-zinc-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="font-semibold text-sm flex items-center gap-2 text-zinc-200">
              <MessageSquare className="w-4 h-4" /> Chat de la classe
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-zinc-600 text-xs py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Personne n'a encore écrit. Soyez le premier!
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={cn("rounded-xl p-3 text-sm", msg.isMe ? "bg-primary/10 border border-primary/20" : "bg-zinc-800/40 border border-zinc-800/50")}>
                  <div className="flex justify-between items-start mb-1.5">
                    <p className={cn("text-xs font-medium", msg.isMe ? "text-primary" : "text-zinc-400")}>{msg.sender}</p>
                    <span className="text-[10px] text-zinc-600">{msg.time}</span>
                  </div>
                  <p className="text-zinc-200">{msg.text}</p>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>
          <div className="p-4 border-t border-zinc-800 bg-[#111]">
            <div className="relative">
              <input
                type="text"
                placeholder="Envoyer un message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none placeholder:text-zinc-500 transition-all"
              />
              <button onClick={sendMessage} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
