import Link from "next/link";
import Image from "next/image";

export default function TicketDemoPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] relative flex flex-col items-center justify-center p-4 overflow-hidden">
      
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/20 via-[#0a0a0a]/80 to-transparent rounded-full pointer-events-none blur-3xl" />

      <div className="w-full max-w-3xl relative z-10 flex flex-col items-center">
        
        <p className="text-zinc-500 text-xs flex items-center gap-2 mb-6">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Maximize Screen Brightness
        </p>

        {/* Ticket Container */}
        <div className="w-full bg-[#161616] border border-zinc-800 rounded-xl overflow-hidden flex flex-col sm:flex-row shadow-2xl relative">
          
          {/* Left Side: Details */}
          <div className="flex-1 p-8 sm:p-10 flex flex-col justify-between">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-zinc-800/80">
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-white font-bold text-lg">The Coming</span>
                <span className="font-serif text-[var(--color-gold)] font-bold text-lg">of Stages</span>
              </div>
              <div className="h-8 w-px bg-zinc-800 mx-2" />
              <div className="flex flex-col">
                <span className="text-zinc-400 text-[10px] tracking-[0.2em] uppercase font-bold">The Coming of Stages</span>
                <span className="text-zinc-500 text-[10px] tracking-widest uppercase">Official Admission</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col mb-10">
              <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-2">Admit One</span>
              <h2 className="font-serif text-4xl text-white mb-2">Eleanor Vance</h2>
              <h3 className="font-serif text-xl text-[var(--color-gold)]">The Midnight Sonata</h3>
            </div>

            {/* Footer Info */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="flex flex-col">
                <span className="text-zinc-600 text-[9px] uppercase tracking-widest font-bold mb-1">Date</span>
                <span className="text-zinc-300 text-sm">Oct 24, 2024</span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-600 text-[9px] uppercase tracking-widest font-bold mb-1">Time</span>
                <span className="text-zinc-300 text-sm">8:00 PM</span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-zinc-600 text-[9px] uppercase tracking-widest font-bold mb-1">Venue</span>
                <span className="text-zinc-300 text-sm">The Grand Lyric Theatre, Section Orchestra, Row G, Seat 12</span>
              </div>
            </div>

          </div>

          {/* Divider */}
          <div className="hidden sm:flex relative w-12 items-center justify-center bg-[#131313] border-l border-r border-zinc-800">
            {/* Top Cutout */}
            <div className="absolute top-[-12px] w-6 h-6 rounded-full bg-[#0a0a0a]" />
            {/* Dashed Line */}
            <div className="h-[90%] w-px border-l-2 border-dashed border-zinc-800/50" />
            {/* Bottom Cutout */}
            <div className="absolute bottom-[-12px] w-6 h-6 rounded-full bg-[#0a0a0a]" />
          </div>

          {/* Right Side: QR Code */}
          <div className="w-full sm:w-72 bg-[#161616] p-8 sm:p-10 flex flex-col items-center justify-center border-t sm:border-t-0 border-zinc-800">
            <div className="w-40 h-40 bg-[#1e1e1e] border border-zinc-800 rounded-lg flex items-center justify-center mb-6 relative p-3 shadow-inner">
               <Image 
                src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg"
                alt="QR Code"
                width={140}
                height={140}
                className="opacity-70 invert"
               />
            </div>
            <span className="text-zinc-600 text-[9px] uppercase tracking-widest font-bold mb-1">Ticket ID</span>
            <span className="text-zinc-400 font-mono text-sm tracking-widest">#123456789</span>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <button className="flex-1 flex justify-center items-center gap-2 bg-[var(--color-gold)] hover:bg-[var(--color-gold-hover)] text-zinc-950 font-bold text-sm py-3.5 rounded-lg transition shadow-lg shadow-yellow-900/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Ticket
          </button>
          <button className="flex-1 flex justify-center items-center gap-2 bg-[#1a1a1a] border border-zinc-800 text-zinc-300 font-medium text-sm py-3.5 rounded-lg hover:bg-zinc-800 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Add to Calendar
          </button>
        </div>

        <Link href="/profile" className="mt-8 text-zinc-500 hover:text-zinc-300 text-sm font-medium flex items-center gap-2 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to My Activities
        </Link>
        
      </div>
    </main>
  );
}
