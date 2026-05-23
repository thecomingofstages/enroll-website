import Image from "next/image";
import Link from "next/link";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="mx-auto max-w-md w-full flex flex-col gap-8">
        
        {/* Profile Card */}
        <section className="bg-[var(--card-bg)] rounded-2xl border border-zinc-800 p-6 flex flex-col items-center">
          
          <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-[var(--color-gold)] ring-offset-4 ring-offset-[var(--card-bg)] mb-4">
            <Image
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80"
              alt="Alex Chen"
              fill
              className="object-cover"
            />
          </div>
          
          <h1 className="font-serif text-3xl text-[var(--color-gold)] font-medium">Alex Chen</h1>
          <p className="text-sm text-zinc-400 mt-1">@alex_stagecraft</p>
          
          <div className="w-full border-t border-zinc-800 my-5" />
          
          <div className="w-full flex flex-col gap-3 text-sm text-zinc-300">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              alex.chen@example.com
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              +1 (555) 019-8372
            </div>
          </div>
          
          <div className="w-full border-t border-zinc-800 my-5" />
          
          <div className="w-full">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-md bg-zinc-800/80 border border-zinc-700 text-xs font-medium text-zinc-300">Stage Play</span>
              <span className="px-3 py-1 rounded-md bg-zinc-800/80 border border-zinc-700 text-xs font-medium text-zinc-300">Music</span>
              <span className="px-3 py-1 rounded-md bg-zinc-800/80 border border-zinc-700 text-xs font-medium text-zinc-300">Indie</span>
            </div>
          </div>
          
          <div className="w-full border-t border-zinc-800 my-5" />
          
          <div className="w-full flex flex-col gap-3">
            <button className="w-full flex justify-center items-center gap-2 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Profile
            </button>
            <Link href="/tickets/demo" className="w-full flex justify-center items-center gap-2 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              My QR Code
            </Link>
          </div>
          
        </section>
        
        {/* Activities Section */}
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-3xl text-white">My Activities</h2>
          
          <div className="flex gap-6 border-b border-zinc-800">
            <button className="pb-3 text-sm font-medium text-[var(--color-gold)] border-b-2 border-[var(--color-gold)]">All</button>
            <button className="pb-3 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition">Upcoming</button>
            <button className="pb-3 text-sm font-medium text-zinc-500 hover:text-zinc-300 transition">Past</button>
          </div>
          
          {/* Activity Card */}
          <div className="bg-[var(--card-bg)] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col mt-2">
            <div className="relative w-full h-48 bg-zinc-900">
              <Image 
                src="https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&q=80"
                alt="Activity Cover"
                fill
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--card-bg)] to-transparent" />
            </div>
            
            <div className="p-5 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-serif text-xl text-zinc-100 leading-tight pr-4">The Glass Menagerie</h3>
                <span className="shrink-0 bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">Joined</span>
              </div>
              
              <div className="flex flex-col gap-1.5 text-xs text-zinc-400 mb-6">
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Nov 15, 2024 • 8:00 PM
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Grand Lyric Theatre, Main Stage
                </div>
              </div>
              
              <Link href="/tickets/demo" className="w-full text-center bg-[var(--color-gold)] hover:bg-[var(--color-gold-hover)] text-zinc-950 font-bold text-sm py-2.5 rounded-lg transition">
                View Ticket
              </Link>
            </div>
          </div>
          
        </section>
        
      </div>
    </main>
  );
}
