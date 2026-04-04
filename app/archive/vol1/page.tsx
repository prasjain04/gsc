import Link from 'next/link';

export default function Vol1ArchivePage() {
    const attendees = [
        { name: 'Prasiddhi', avatar: null, dish: null, isYou: true },
        { name: 'Luola', avatar: null, dish: "Mom's Dal Fry & Jeera Rice", tags: ['🥛'] },
        { name: 'Hannah', avatar: null, dish: null },
        { name: 'Aditi', avatar: null, dish: null },
        { name: 'Alexis', avatar: null, dish: 'Cold Noodle Salad with Spicy Peanut Dressing', tags: ['🥜', '🫘', '🥦'] },
        { name: 'Jennie', avatar: null, dish: null },
        { name: 'Maggie Luo', avatar: null, dish: 'Masala Pot Pies', tags: ['🥛', '🥦'] },
        { name: 'Phoebe Smukler', avatar: null, dish: 'Herbed Ricotta Crostini Dip', tags: ['🥛', '🥦'] },
        { name: 'Amy', avatar: null, dish: null },
        { name: 'Karen Shi', avatar: null, dish: null },
        { name: 'Jennie', avatar: null, dish: null },
    ];

    const declined = ['Yax', 'Thara Konduri'];

    const coverUrl = '/vol1-cover.jpg';
    const pdfUrl = 'https://drive.google.com/file/d/1jhak8Njmp9kDRDU4DGKDEm_cXAm7M7VH/view?usp=drive_link';

    return (
        <main className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
            {/* Header */}
            <header className="pt-12 pb-8 px-4 flex flex-col items-center flex-shrink-0" style={{ background: 'var(--bg)' }}>
                <Link href="/archive" className="text-xs font-body mb-6 hover:opacity-70 transition-opacity" style={{ color: 'var(--accent-warm)' }}>
                    ← Back to Archive
                </Link>
                <h1 className="font-display italic text-4xl text-center" style={{ color: 'var(--ink)' }}>
                    Girls Supper Club
                </h1>
            </header>

            <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row gap-8">
                {/* Left Column */}
                <div className="w-full md:w-72 flex-shrink-0 space-y-6">
                    <div className="p-5 rounded-lg shadow-sm" style={{ background: 'var(--surface)', border: '1px solid rgba(212, 184, 150, 0.3)' }}>
                        <p className="font-body text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--accent-warm)' }}>Vol. I</p>
                        <h2 className="font-display italic text-3xl mb-4" style={{ color: 'var(--ink)' }}>Vol. 1</h2>

                        <div className="space-y-4 font-body text-sm" style={{ color: 'var(--ink)' }}>
                            <div className="flex items-start gap-3">
                                <span className="text-base" style={{ filter: 'grayscale(1)', opacity: 0.7 }}>📅</span>
                                <div>Sunday, the 8th of March</div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-base" style={{ filter: 'grayscale(1)', opacity: 0.7 }}>⏱️</span>
                                <div>6:00 PM</div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-base" style={{ filter: 'grayscale(1)', opacity: 0.7 }}>📍</span>
                                <div className="leading-relaxed">195 Binney St, Apt 2221 Cambridge, MA 02142</div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(212, 184, 150, 0.2)' }}>
                            <p className="font-body text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--accent-warm)' }}>Cookbook</p>
                            <p className="font-display italic text-lg" style={{ color: 'var(--ink)' }}>The Chutney Life</p>
                        </div>
                    </div>

                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="block group">
                        <div className="cookbook-cover relative overflow-hidden" style={{ cursor: 'pointer' }}>
                            <img src={coverUrl} alt="The Chutney Life" className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                        </div>
                        <div className="mt-2 text-center">
                            <p className="font-body text-xs uppercase tracking-wider" style={{ color: 'var(--accent-warm)' }}>
                                View PDF ↗
                            </p>
                        </div>
                    </a>
                </div>

                {/* Right Column */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-4">
                        <p className="font-display italic text-lg" style={{ color: 'var(--ink)' }}>
                            11 girlies came 🍴
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {attendees.map((a, i) => (
                            <div key={i} className="guest-card flex flex-col p-4 rounded-xl shadow-sm" style={{ background: 'var(--surface)', border: a.isYou ? '1px solid var(--accent)' : '1px solid transparent' }}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-display italic text-lg" style={{ background: 'rgba(212, 184, 150, 0.1)', color: 'var(--accent-warm)' }}>
                                            {a.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-body font-medium" style={{ color: 'var(--ink)' }}>{a.name}</p>
                                        </div>
                                    </div>
                                    {a.isYou && (
                                        <span className="text-[10px] font-body uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: 'var(--accent)', color: 'var(--surface)' }}>You</span>
                                    )}
                                </div>

                                <div className="mt-auto pt-3" style={{ borderTop: '1px solid rgba(212, 184, 150, 0.1)' }}>
                                    {a.dish ? (
                                        <div>
                                            <p className="text-xs font-body font-medium leading-relaxed" style={{ color: 'var(--ink)' }}>
                                                {a.dish}
                                            </p>
                                            {a.tags && a.tags.length > 0 && (
                                                <div className="flex gap-1 mt-1.5 opacity-80">
                                                    {a.tags.map((t, idx) => (
                                                        <span key={idx} className="text-xs">{t}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs font-body italic" style={{ color: 'var(--accent-warm)', opacity: 0.7 }}>
                                            Hasn't picked yet 💭
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(212, 184, 150, 0.2)' }}>
                        <p className="font-display italic text-sm mb-3" style={{ color: 'var(--accent-warm)' }}>
                            Couldn't make it 💔
                        </p>
                        <div className="flex flex-wrap gap-3">
                            {declined.map((d, i) => (
                                <div key={i} className="flex items-center gap-2 py-1.5 px-3 rounded-full" style={{ background: 'rgba(212, 184, 150, 0.1)', border: '1px solid rgba(212, 184, 150, 0.2)' }}>
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center font-display italic text-[10px]" style={{ background: 'var(--surface)', color: 'var(--accent-warm)' }}>
                                        {d.charAt(0)}
                                    </div>
                                    <span className="font-body text-xs" style={{ color: 'var(--accent-warm)' }}>{d}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
