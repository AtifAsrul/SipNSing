import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Copy, Check, Music, History, Users } from 'lucide-react';

const MarketingView = () => {
    const [queue, setQueue] = useState([]);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'history'
    const [copiedId, setCopiedId] = useState(null);

    // Real-time Queue
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

            // Sort by creation time
            allRequests.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeA - timeB;
            });

            setQueue(allRequests);
        });
        return () => unsubscribe();
    }, []);

    // Real-time History
    useEffect(() => {
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
    }, []);

    const copyToClipboard = (text, id) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const renderCard = (req, index = null) => (
        <div key={req.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 mb-3 shadow-sm">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    {index !== null && (
                        <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-0.5 rounded-full">
                            #{index + 1}
                        </span>
                    )}
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${req.status === 'playing' ? 'bg-purple-500/20 text-purple-400 animate-pulse' :
                            req.status === 'queued' ? 'bg-green-500/20 text-green-400' :
                                req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                    req.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-red-500/20 text-red-400'
                        }`}>
                        {req.status}
                    </span>
                </div>
                <button
                    onClick={() => copyToClipboard(req.igHandle ? `@${req.igHandle}` : '', req.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copiedId === req.id
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                >
                    {copiedId === req.id ? (
                        <>
                            <Check size={14} /> Copied!
                        </>
                    ) : (
                        <>
                            <Copy size={14} /> Copy IG
                        </>
                    )}
                </button>
            </div>

            <div className="space-y-1">
                <h3 className="text-white font-bold text-lg leading-tight">{req.singerName}</h3>
                {req.igHandle && (
                    <p className="text-purple-400 font-medium">@{req.igHandle}</p>
                )}
                <div className="flex items-center gap-2 text-slate-500 text-sm mt-2 pt-2 border-t border-slate-800/50">
                    <Music size={14} />
                    <span className="truncate">{req.song} - {req.artist}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 pb-20">
            <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="text-purple-500" />
                    Marketing Feed
                </h1>
            </header>

            <div className="p-4">
                {/* Tabs */}
                <div className="flex bg-slate-900 rounded-xl p-1 mb-6 border border-slate-800">
                    <button
                        onClick={() => setActiveTab('queue')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'queue'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        Live Queue ({queue.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        History
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    {activeTab === 'queue' ? (
                        queue.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <p>Queue is empty</p>
                            </div>
                        ) : (
                            queue.map((req, index) => renderCard(req, index))
                        )
                    ) : (
                        history.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <p>No history yet</p>
                            </div>
                        ) : (
                            history.map((req) => renderCard(req))
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarketingView;
