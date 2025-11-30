import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, where, limit, writeBatch, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Play, Check, X, Search, Trash2, ExternalLink, Edit2, Save, History, ListMusic, AlertTriangle } from 'lucide-react';

const AdminDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'history'
    const [nowPlaying, setNowPlaying] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ song: '', artist: '', youtubeUrl: '' });
    const [theme, setTheme] = useState('default');

    // Effect for Theme (Real-time)
    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'settings', 'config'), (doc) => {
            if (doc.exists()) {
                setTheme(doc.data().theme || 'default');
            }
        });
        return () => unsubscribe();
    }, []);

    // Effect for Active Queue (Real-time)
    useEffect(() => {
        const q = query(
            collection(db, 'requests'),
            where('status', 'in', ['pending', 'queued', 'playing'])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allRequests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Client-side sort for active items
            allRequests.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeA - timeB;
            });

            setRequests(allRequests);

            const playing = allRequests.find(r => r.status === 'playing');
            setNowPlaying(playing);
        });
        return () => unsubscribe();
    }, []);

    // Effect for History (Only when tab is active)
    useEffect(() => {
        if (activeTab !== 'history') return;

        const q = query(
            collection(db, 'requests'),
            where('status', 'in', ['completed', 'rejected']),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const historyItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setHistory(historyItems);
        });

        return () => unsubscribe();
    }, [activeTab]);

    const handleThemeChange = async (newTheme) => {
        try {
            await setDoc(doc(db, 'settings', 'config'), { theme: newTheme }, { merge: true });
        } catch (error) {
            console.error("Error updating theme:", error);
            alert("Failed to update theme");
        }
    };

    const handleApprove = async (request) => {
        const url = prompt(`Enter YouTube URL for "${request.song}" by ${request.artist}:`);
        if (url) {
            await updateDoc(doc(db, 'requests', request.id), {
                status: 'queued',
                youtubeUrl: url
            });
        }
    };

    const handleReject = async (id) => {
        if (confirm('Reject this request?')) {
            await updateDoc(doc(db, 'requests', id), { status: 'rejected' });
        }
    };

    const handlePlay = async (request) => {
        if (request.youtubeUrl) {
            window.open(request.youtubeUrl, '_blank');
        } else {
            alert("No YouTube URL found for this song.");
            return;
        }

        if (nowPlaying) {
            await updateDoc(doc(db, 'requests', nowPlaying.id), { status: 'completed' });
        }
        await updateDoc(doc(db, 'requests', request.id), { status: 'playing' });
    };

    const handleDone = async (id) => {
        await updateDoc(doc(db, 'requests', id), { status: 'completed' });
    };

    const startEditing = (req) => {
        setEditingId(req.id);
        setEditForm({
            song: req.song,
            artist: req.artist,
            youtubeUrl: req.youtubeUrl || ''
        });
    };

    const saveEdit = async () => {
        if (!editingId) return;
        await updateDoc(doc(db, 'requests', editingId), {
            song: editForm.song,
            artist: editForm.artist,
            youtubeUrl: editForm.youtubeUrl
        });
        setEditingId(null);
    };

    const handleResetEvent = async () => {
        const confirmReset = confirm("DANGER: This will delete ALL requests (Queue & History). This cannot be undone.\n\nAre you sure you want to reset the event?");
        if (!confirmReset) return;

        const secondConfirm = confirm("Please confirm one more time: DELETE EVERYTHING?");
        if (!secondConfirm) return;

        try {
            const q = query(collection(db, 'requests'));
            const snapshot = await getDocs(q);

            // Batch delete in chunks of 500
            const chunks = [];
            let batch = writeBatch(db);
            let count = 0;

            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
                count++;
                if (count >= 400) { // Commit every 400 to be safe
                    chunks.push(batch.commit());
                    batch = writeBatch(db);
                    count = 0;
                }
            });

            if (count > 0) {
                chunks.push(batch.commit());
            }

            await Promise.all(chunks);
            alert("Event has been reset. All data cleared.");
        } catch (error) {
            console.error("Error resetting event:", error);
            alert("Failed to reset event: " + error.message);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const queuedRequests = requests.filter(r => r.status === 'queued');

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <header className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-purple-400">Admin Dashboard</h1>
                        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                            <button
                                onClick={() => setActiveTab('queue')}
                                className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${activeTab === 'queue' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <ListMusic size={16} /> Live Queue
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <History size={16} /> History
                            </button>
                        </div>
                    </div>

                    {/* Theme Switcher */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-bold uppercase">Theme:</span>
                        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                            <button
                                onClick={() => handleThemeChange('default')}
                                className={`px-3 py-1 rounded text-xs font-medium transition-all ${theme === 'default' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Default
                            </button>
                            <button
                                onClick={() => handleThemeChange('orange')}
                                className={`px-3 py-1 rounded text-xs font-medium transition-all ${theme === 'orange' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Spooky
                            </button>
                            <button
                                onClick={() => handleThemeChange('christmas')}
                                className={`px-3 py-1 rounded text-xs font-medium transition-all ${theme === 'christmas' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Holiday
                            </button>
                        </div>
                    </div>
                </div>

                {nowPlaying && (
                    <div className="bg-slate-900 px-4 py-2 rounded-lg border border-purple-500/50 flex items-center gap-4 w-full md:w-auto justify-between">
                        <div>
                            <p className="text-xs text-purple-400 uppercase font-bold">Now Playing</p>
                            <p className="text-white font-medium">{nowPlaying.song} - {nowPlaying.artist}</p>
                        </div>
                        <button
                            onClick={() => handleDone(nowPlaying.id)}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap"
                        >
                            Mark Done
                        </button>
                    </div>
                )}
            </header>

            {activeTab === 'queue' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pending Requests */}
                    <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                        <h2 className="text-xl font-bold mb-4 text-purple-400 flex items-center gap-2">
                            <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-sm">{pendingRequests.length}</span>
                            Pending Requests
                        </h2>
                        <div className="space-y-3">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="bg-slate-800 p-4 rounded-lg flex flex-col gap-3">
                                    {editingId === req.id ? (
                                        <div className="space-y-2">
                                            <input
                                                className="w-full bg-slate-700 p-2 rounded text-white"
                                                value={editForm.song}
                                                onChange={e => setEditForm({ ...editForm, song: e.target.value })}
                                                placeholder="Song"
                                            />
                                            <input
                                                className="w-full bg-slate-700 p-2 rounded text-white"
                                                value={editForm.artist}
                                                onChange={e => setEditForm({ ...editForm, artist: e.target.value })}
                                                placeholder="Artist"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={saveEdit} className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"><Save size={14} /> Save</button>
                                                <button onClick={() => setEditingId(null)} className="bg-slate-600 text-white px-3 py-1 rounded">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <h3 className="font-bold text-white">{req.song}</h3>
                                                <p className="text-slate-400 text-sm">
                                                    {req.artist} • Requested by {req.singerName}
                                                    {req.igHandle && <span className="text-purple-400 ml-1">(@{req.igHandle})</span>}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(req.song + ' karaoke ' + req.artist)}`, '_blank')}
                                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded flex items-center justify-center gap-2 text-sm transition-colors"
                                                >
                                                    <Search size={16} /> Search
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(req)}
                                                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded flex items-center justify-center gap-2 text-sm transition-colors"
                                                >
                                                    <Check size={16} /> Approve
                                                </button>
                                                <button
                                                    onClick={() => startEditing(req)}
                                                    className="px-3 bg-blue-600/50 hover:bg-blue-600 text-blue-100 rounded flex items-center justify-center transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleReject(req.id)}
                                                    className="px-3 bg-red-900/50 hover:bg-red-900 text-red-200 rounded flex items-center justify-center transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {pendingRequests.length === 0 && (
                                <p className="text-slate-500 text-center py-4">No pending requests</p>
                            )}
                        </div>
                    </section>

                    {/* Approved Queue */}
                    <section className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                        <h2 className="text-xl font-bold mb-4 text-green-400 flex items-center gap-2">
                            <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-sm">{queuedRequests.length}</span>
                            Up Next
                        </h2>
                        <div className="space-y-3">
                            {queuedRequests.map((req, index) => (
                                <div key={req.id} className="bg-slate-800 p-4 rounded-lg flex flex-col gap-2">
                                    {editingId === req.id ? (
                                        <div className="space-y-2">
                                            <input
                                                className="w-full bg-slate-700 p-2 rounded text-white"
                                                value={editForm.song}
                                                onChange={e => setEditForm({ ...editForm, song: e.target.value })}
                                            />
                                            <input
                                                className="w-full bg-slate-700 p-2 rounded text-white"
                                                value={editForm.artist}
                                                onChange={e => setEditForm({ ...editForm, artist: e.target.value })}
                                            />
                                            <input
                                                className="w-full bg-slate-700 p-2 rounded text-white"
                                                value={editForm.youtubeUrl}
                                                onChange={e => setEditForm({ ...editForm, youtubeUrl: e.target.value })}
                                                placeholder="YouTube URL"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={saveEdit} className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"><Save size={14} /> Save</button>
                                                <button onClick={() => setEditingId(null)} className="bg-slate-600 text-white px-3 py-1 rounded">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <span className="text-slate-500 font-bold text-lg w-6">{index + 1}</span>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-white truncate">{req.song}</h3>
                                                    <p className="text-slate-400 text-sm truncate">
                                                        {req.singerName} {req.igHandle && <span className="text-purple-400">(@{req.igHandle})</span>}
                                                    </p>
                                                    <a href={req.youtubeUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline truncate block">
                                                        {req.youtubeUrl}
                                                    </a>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => handlePlay(req)}
                                                    className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-full transition-colors"
                                                    title="Play (Open in New Tab)"
                                                >
                                                    <Play size={20} fill="currentColor" />
                                                </button>
                                                <button
                                                    onClick={() => startEditing(req)}
                                                    className="bg-blue-600/50 hover:bg-blue-600 text-blue-100 p-2 rounded-full transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleReject(req.id)}
                                                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 p-2 rounded-full transition-colors"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {queuedRequests.length === 0 && (
                                <p className="text-slate-500 text-center py-4">Queue is empty</p>
                            )}
                        </div>
                    </section>
                </div>
            ) : (
                <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                    <h2 className="text-xl font-bold mb-4 text-slate-400 flex items-center gap-2">
                        <History size={20} />
                        Past Requests (Last 50)
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-900 text-slate-200 uppercase font-medium">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Time</th>
                                    <th className="px-4 py-3">Performer</th>
                                    <th className="px-4 py-3">IG Handle</th>
                                    <th className="px-4 py-3">Song</th>
                                    <th className="px-4 py-3 rounded-tr-lg">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {history.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3">
                                            {req.createdAt?.seconds ? new Date(req.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-white">{req.singerName}</td>
                                        <td className="px-4 py-3 text-purple-400">{req.igHandle ? `@${req.igHandle}` : '-'}</td>
                                        <td className="px-4 py-3">{req.song} - {req.artist}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs ${req.status === 'completed' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-slate-500">No history found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Danger Zone */}
            <div className="mt-12 border-t border-red-900/30 pt-8 flex justify-center">
                <button
                    onClick={handleResetEvent}
                    className="text-red-400/60 hover:text-red-400 text-xs flex items-center gap-2 transition-colors hover:underline"
                >
                    <AlertTriangle size={14} />
                    Reset Event (Clear All Data)
                </button>
            </div>

            <footer className="mt-12 text-center text-slate-600 text-sm pb-4">
                <p>Sip n Sing Admin Dashboard • Made by tip_.ziz</p>
            </footer>
        </div>
    );
};

export default AdminDashboard;
