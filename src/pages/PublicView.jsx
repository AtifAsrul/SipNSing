import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Mic2, Music, User, Disc3, Sparkles } from 'lucide-react';

const PublicView = () => {
    const [name, setName] = useState('');
    const [igHandle, setIgHandle] = useState('');
    const [song, setSong] = useState('');
    const [artist, setArtist] = useState('');
    const [backingTrack, setBackingTrack] = useState('karaoke');
    const [technicalNeeds, setTechnicalNeeds] = useState('');
    const [queue, setQueue] = useState([]);
    const [nowPlaying, setNowPlaying] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [theme, setTheme] = useState('default');

    const themeStyles = {
        default: {
            bg: 'bg-slate-950',
            text: 'text-purple-400',
            accent: 'bg-purple-500',
            gradient: 'from-purple-500 to-pink-500',
            textGradient: 'from-white via-purple-200 to-pink-200',
            button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500',
            blob1: 'bg-purple-600/20',
            blob2: 'bg-pink-600/20',
            blob3: 'bg-blue-600/10',
            border: 'border-purple-500/30',
            shadow: 'shadow-purple-500/20',
            wait: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
        },
        orange: {
            bg: 'bg-neutral-950',
            text: 'text-orange-500',
            accent: 'bg-orange-600',
            gradient: 'from-orange-600 to-red-600',
            textGradient: 'from-white via-orange-200 to-red-200',
            button: 'bg-gradient-to-r from-orange-700 to-red-700 hover:from-orange-600 hover:to-red-600',
            blob1: 'bg-orange-600/20',
            blob2: 'bg-red-900/20',
            blob3: 'bg-yellow-600/10',
            border: 'border-orange-500/30',
            shadow: 'shadow-orange-500/20',
            wait: 'text-orange-400 bg-orange-500/10 border-orange-500/20'
        },
        christmas: {
            bg: 'bg-slate-950',
            text: 'text-red-400',
            accent: 'bg-green-600',
            gradient: 'from-red-600 via-green-600 to-red-600',
            textGradient: 'from-red-200 via-green-200 to-gold-200',
            button: 'bg-gradient-to-r from-red-700 via-green-700 to-red-700 hover:from-red-600 hover:to-green-600',
            blob1: 'bg-red-600/30',
            blob2: 'bg-green-600/30',
            blob3: 'bg-yellow-500/20',
            border: 'border-red-500/50',
            shadow: 'shadow-green-500/30',
            wait: 'text-green-400 bg-green-500/10 border-green-500/20'
        }
    };

    const currentTheme = themeStyles[theme] || themeStyles.default;

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'settings', 'config'), (doc) => {
            if (doc.exists()) {
                setTheme(doc.data().theme || 'default');
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const q = query(
            collection(db, 'requests'),
            where('status', 'in', ['queued', 'playing'])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            requests.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeA - timeB;
            });

            const playing = requests.find(r => r.status === 'playing');
            const queued = requests.filter(r => r.status === 'queued');

            setNowPlaying(playing);
            setQueue(queued);
        }, (error) => {
            console.error("Error fetching queue:", error);
        });

        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !song || !artist) return;

        setLoading(true);
        try {
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out. Check your internet connection or Firebase configuration.")), 10000)
            );

            await Promise.race([
                addDoc(collection(db, 'requests'), {
                    singerName: name,
                    igHandle: igHandle || '',
                    song,
                    artist,
                    backingTrack,
                    technicalNeeds: backingTrack === 'none' ? technicalNeeds : null,
                    status: 'pending',
                    createdAt: serverTimestamp()
                }),
                timeout
            ]);

            setSubmitted(true);
            setName('');
            setIgHandle('');
            setSong('');
            setArtist('');
            setBackingTrack('karaoke');
            setTechnicalNeeds('');
            setTimeout(() => setSubmitted(false), 3000);
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Failed to submit: " + error.message);
        }
        setLoading(false);
    };

    return (
        <div className={`min-h-screen ${currentTheme.bg} relative overflow-hidden selection:bg-purple-500/30 transition-colors duration-700`}>
            {/* Animated Background Blobs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className={`absolute top-[-10%] left-[-10%] w-96 h-96 ${currentTheme.blob1} rounded-full blur-3xl animate-pulse-slow transition-colors duration-700`}></div>
                <div className={`absolute bottom-[-10%] right-[-10%] w-96 h-96 ${currentTheme.blob2} rounded-full blur-3xl animate-pulse-slow delay-1000 transition-colors duration-700`}></div>
                <div className={`absolute top-[40%] left-[40%] w-64 h-64 ${currentTheme.blob3} rounded-full blur-3xl animate-pulse-slow delay-2000 transition-colors duration-700`}></div>
            </div>

            <div className="max-w-md mx-auto pb-24 relative z-10">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-slate-950/70 backdrop-blur-xl border-b border-white/5 p-4 shadow-2xl">
                    <div className="flex flex-col items-center justify-center mb-4">
                        <div className={`w-32 h-32 bg-gradient-to-br ${currentTheme.gradient} rounded-2xl flex items-center justify-center ${currentTheme.shadow} mb-3 rotate-3 hover:rotate-6 transition-all overflow-hidden relative`}>
                            <img
                                src="/logo.png"
                                alt="Logo"
                                className="w-full h-full object-contain p-2 absolute inset-0 z-10"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.classList.remove('hidden') }}
                            />
                            <Mic2 className="text-white w-12 h-12 hidden z-0" />
                        </div>
                        <h1 className={`text-2xl font-black tracking-tight bg-gradient-to-r ${currentTheme.textGradient} bg-clip-text text-transparent transition-all`}>
                            Sip n Sing
                        </h1>
                        <p className={`text-xs ${currentTheme.text} font-medium tracking-widest uppercase mt-1 transition-colors`}>Music Society</p>
                    </div>


                </header>

                <main className="p-4 space-y-8">
                    {/* Request Form */}
                    <section className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-white/5 relative overflow-hidden group">
                        <div className={`absolute inset-0 bg-gradient-to-br ${currentTheme.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-white relative z-10">
                            <div className={`p-1.5 rounded-lg ${currentTheme.bg} ${currentTheme.text} bg-opacity-50`}>
                                <Sparkles className="w-4 h-4" />
                            </div>
                            Request a Song
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400 ml-1">Your Name</label>
                                    <div className="relative group/input">
                                        <User className={`absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within/input:${currentTheme.text} transition-colors`} />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className={`w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:${currentTheme.border} focus:ring-2 focus:ring-opacity-20 transition-all`}
                                            placeholder="Name"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400 ml-1">IG Handle</label>
                                    <div className="relative group/input">
                                        <span className={`absolute left-3 top-2.5 text-slate-500 font-medium group-focus-within/input:${currentTheme.text} transition-colors`}>@</span>
                                        <input
                                            type="text"
                                            value={igHandle}
                                            onChange={(e) => setIgHandle(e.target.value)}
                                            className={`w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-8 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:${currentTheme.border} focus:ring-2 focus:ring-opacity-20 transition-all`}
                                            placeholder="username"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-400 ml-1">Song Details</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        value={song}
                                        onChange={(e) => setSong(e.target.value)}
                                        className={`w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:${currentTheme.border} focus:ring-2 focus:ring-opacity-20 transition-all`}
                                        placeholder="Song Title"
                                        required
                                    />
                                    <input
                                        type="text"
                                        value={artist}
                                        onChange={(e) => setArtist(e.target.value)}
                                        className={`w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:${currentTheme.border} focus:ring-2 focus:ring-opacity-20 transition-all`}
                                        placeholder="Artist"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-medium text-slate-400 ml-1">Performance Style</label>
                                <div className="space-y-3">
                                    <div className="flex gap-2 p-1 bg-slate-950/50 rounded-xl border border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setBackingTrack('karaoke')} // Default to karaoke if they switch back
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${backingTrack !== 'none'
                                                ? `${currentTheme.bg} ${currentTheme.text} shadow-lg border border-white/10`
                                                : 'text-slate-500 hover:text-slate-300'
                                                }`}
                                        >
                                            Backing Track
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBackingTrack('none')}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${backingTrack === 'none'
                                                ? `${currentTheme.bg} ${currentTheme.text} shadow-lg border border-white/10`
                                                : 'text-slate-500 hover:text-slate-300'
                                                }`}
                                        >
                                            Acoustic / Acapella
                                        </button>
                                    </div>

                                    {backingTrack === 'none' ? (
                                        <div className="animate-fade-in-up">
                                            <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5 block">Technical Requirements</label>
                                            <textarea
                                                value={technicalNeeds}
                                                onChange={(e) => setTechnicalNeeds(e.target.value)}
                                                className={`w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:${currentTheme.border} focus:ring-2 focus:ring-opacity-20 transition-all text-sm min-h-[80px]`}
                                                placeholder="e.g. I need 2 mics, a chair, and a DI box for my guitar..."
                                                required
                                            />
                                        </div>
                                    ) : (
                                        <div className="animate-fade-in-up grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setBackingTrack('karaoke')}
                                                className={`p-3 rounded-xl border text-left transition-all ${backingTrack === 'karaoke'
                                                    ? `${currentTheme.border} ${currentTheme.bg} ring-1 ring-${currentTheme.text}`
                                                    : 'border-slate-800 bg-slate-950/30 hover:border-slate-700'
                                                    }`}
                                            >
                                                <div className={`font-bold ${backingTrack === 'karaoke' ? currentTheme.text : 'text-slate-300'}`}>Karaoke Version</div>
                                                <div className="text-xs text-slate-500 mt-1">No vocals, just the music</div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBackingTrack('original')}
                                                className={`p-3 rounded-xl border text-left transition-all ${backingTrack === 'original'
                                                    ? `${currentTheme.border} ${currentTheme.bg} ring-1 ring-${currentTheme.text}`
                                                    : 'border-slate-800 bg-slate-950/30 hover:border-slate-700'
                                                    }`}
                                            >
                                                <div className={`font-bold ${backingTrack === 'original' ? currentTheme.text : 'text-slate-300'}`}>Original Version</div>
                                                <div className="text-xs text-slate-500 mt-1">With original vocals</div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3.5 rounded-xl font-bold text-lg shadow-lg ${currentTheme.shadow} transition-all transform active:scale-[0.98] ${submitted
                                    ? 'bg-green-500 text-white'
                                    : `${currentTheme.button} text-white`
                                    }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Sending...
                                    </span>
                                ) : submitted ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Sparkles className="w-5 h-5" />
                                        Request Sent!
                                    </span>
                                ) : (
                                    'Join Queue'
                                )}
                            </button>
                        </form>
                    </section>

                    {/* Now Playing (Moved) */}
                    {nowPlaying && (
                        <div className={`bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border ${currentTheme.border} shadow-xl shadow-purple-900/10 animate-fade-in-up transition-colors`}>
                            <div className="flex items-center gap-4">
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 relative z-10">
                                        <Disc3 className={`w-6 h-6 ${currentTheme.text} animate-spin-slow transition-colors`} />
                                    </div>
                                    <div className={`absolute inset-0 ${currentTheme.accent} blur-xl opacity-40 animate-pulse transition-colors`}></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${currentTheme.bg} bg-opacity-50 ${currentTheme.text} text-[10px] font-bold uppercase tracking-wider border border-white/5`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${currentTheme.accent} animate-pulse`}></span>
                                            Now Playing
                                        </span>
                                    </div>
                                    <p className="text-white font-bold truncate text-lg leading-tight">{nowPlaying.song}</p>
                                    <p className="text-slate-400 text-sm truncate flex items-center gap-1">
                                        {nowPlaying.singerName}
                                        {nowPlaying.igHandle && <span className={`${currentTheme.text} font-medium`}>@{nowPlaying.igHandle}</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Live Queue */}
                    <section>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h2 className="text-lg font-bold flex items-center gap-3 text-white">
                                <div className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </div>
                                Up Next <span className="text-slate-500 font-normal">({queue.length})</span>
                            </h2>
                            {queue.length > 0 && (
                                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${currentTheme.wait}`}>
                                    ~{queue.length * 4} min wait
                                </span>
                            )}
                        </div>

                        <div className="space-y-3">
                            {queue.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
                                    <Music className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                                    <p className="font-medium">The stage is empty.</p>
                                    <p className="text-sm opacity-60">Be the first to perform!</p>
                                </div>
                            ) : (
                                queue.map((req, index) => (
                                    <div
                                        key={req.id}
                                        className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-slate-800/40 transition-colors group"
                                    >
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center font-bold text-slate-400 group-hover:text-white group-hover:bg-white/10 transition-colors border border-white/5">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white truncate text-lg">{req.song}</h3>
                                            <p className="text-sm text-slate-400 truncate flex items-center gap-1.5">
                                                <span className="text-slate-300">{req.singerName}</span>
                                                {req.igHandle && <span className={`${currentTheme.text} text-xs bg-white/5 px-1.5 py-0.5 rounded`}>@{req.igHandle}</span>}
                                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                                <span>{req.artist}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </main>

                <footer className="p-6 text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-slate-600 text-sm">
                        <span>Made with</span>
                        <span className="text-pink-500 animate-pulse">♥</span>
                        <span>by</span>
                        <a
                            href="https://instagram.com/tip_.ziz"
                            target="_blank"
                            rel="noreferrer"
                            className={`${currentTheme.text} hover:opacity-80 font-medium transition-colors`}
                        >
                            tip_.ziz
                        </a>
                    </div>
                    <a href="/admin" className="inline-block text-slate-700 hover:text-slate-500 text-xs transition-colors">
                        Admin Access
                    </a>
                </footer>
            </div>
        </div>
    );
};

export default PublicView;
