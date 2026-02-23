import { useState, useEffect } from 'react';
import { Package, Trash2, Plus, Mail, FileText, Link as LinkIcon, Video, Star, Calendar, Pencil, Check, X } from 'lucide-react';

const API = window.location.hostname === 'localhost' ? 'http://localhost:3002' : '';

interface Product {
    id: number;
    title: string;
    description: string;
    price: number;
    oldPrice?: number;
    type: string;
    category: string;
    image_url?: string;
    file_path?: string;
    details?: string;
}

interface Service {
    id: number;
    title: string;
    duration: string;
    price: string;
    description: string;
    details?: string;
    booking_url?: string;
}

interface Submission {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    created_at: string;
}

const inputCls = 'w-full bg-navy border border-gold/20 p-2 rounded-md focus:border-gold outline-none text-sm text-white';

export default function AdminDashboard() {
    // --- Auth state (must be first) ---
    const [authed, setAuthed] = useState(() => sessionStorage.getItem('nsk_admin') === 'true');
    const [pw, setPw] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    // --- All hooks declared unconditionally (React rules) ---
    const [products, setProducts] = useState<Product[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [view, setView] = useState<'products' | 'vip' | 'services' | 'submissions'>('products');
    const [isAdding, setIsAdding] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [newProduct, setNewProduct] = useState({ title: '', description: '', price: 0, oldPrice: '', type: 'PDF', category: 'E-booki', details: '' });
    const [newService, setNewService] = useState({ title: '', duration: '', price: '', description: '', details: '', booking_url: '' });

    const fetchData = () => {
        fetch(`${API}/api/products`).then(r => r.json()).then(setProducts).catch(() => { });
        fetch(`${API}/api/services`).then(r => r.json()).then(setServices).catch(() => { });
        fetch(`${API}/api/admin/submissions`).then(r => r.json()).then(setSubmissions).catch(() => { });
    };

    useEffect(() => { if (authed) fetchData(); }, [authed]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError('');
        try {
            const res = await fetch(`${API}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pw })
            });
            const data = await res.json();
            if (data.success) {
                sessionStorage.setItem('nsk_admin', 'true');
                setAuthed(true);
            } else {
                setLoginError('Nieprawidłowe hasło.');
            }
        } catch {
            setLoginError('Błąd połączenia z serwerem.');
        } finally {
            setLoginLoading(false);
        }
    };

    if (!authed) {
        return (
            <div className="min-h-screen bg-navy flex items-center justify-center p-6">
                <div className="bg-navy-dark border border-gold/30 rounded-2xl p-10 w-full max-w-sm shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🔐</span>
                        </div>
                        <h1 className="text-2xl font-serif text-white">Panel Admina</h1>
                        <p className="text-white/40 text-sm mt-1">NextStep<span className="text-gold">Kariera</span></p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Hasło administratora"
                            value={pw}
                            onChange={e => setPw(e.target.value)}
                            className="w-full bg-navy border border-gold/20 p-4 rounded-xl focus:border-gold outline-none text-white text-center tracking-widest"
                            autoFocus
                        />
                        {loginError && <p className="text-red-400 text-sm text-center">{loginError}</p>}
                        <button
                            type="submit"
                            disabled={loginLoading || !pw}
                            className="w-full bg-gold text-navy-dark font-bold py-4 rounded-xl hover:bg-gold/90 transition-all disabled:opacity-40"
                        >
                            {loginLoading ? 'Logowanie...' : 'Zaloguj'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const handleDelete = (type: 'products' | 'services', id: number) => {
        if (confirm('Czy na pewno chcesz usunąć?')) {
            fetch(`${API}/api/${type}/${id}`, { method: 'DELETE' }).then(fetchData);
        }
    };

    const resetForms = () => {
        setNewProduct({ title: '', description: '', price: 0, oldPrice: '', type: 'PDF', category: 'E-booki', details: '' });
        setNewService({ title: '', duration: '', price: '', description: '', details: '', booking_url: '' });
        setEditingProduct(null);
        setEditingService(null);
    };

    const handleTabChange = (newView: any) => {
        setView(newView);
        setIsAdding(false);
        resetForms();
        if (newView === 'vip') setNewProduct(prev => ({ ...prev, category: 'Pakiet VIP' }));
        else if (newView === 'products') setNewProduct(prev => ({ ...prev, category: 'E-booki' }));
    };

    // --- Add handlers ---
    const handleAddProduct = (e: React.FormEvent) => {
        e.preventDefault();
        fetch(`${API}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newProduct, oldPrice: view === 'vip' ? newProduct.oldPrice : null })
        }).then(() => { setIsAdding(false); resetForms(); fetchData(); });
    };

    const handleAddService = (e: React.FormEvent) => {
        e.preventDefault();
        fetch(`${API}/api/services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newService)
        }).then(() => { setIsAdding(false); resetForms(); fetchData(); });
    };

    // --- Edit/Save handlers ---
    const handleSaveProduct = () => {
        if (!editingProduct) return;
        fetch(`${API}/api/products/${editingProduct.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingProduct)
        }).then(() => { setEditingProduct(null); fetchData(); });
    };

    const handleSaveService = () => {
        if (!editingService) return;
        fetch(`${API}/api/services/${editingService.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingService)
        }).then(() => { setEditingService(null); fetchData(); });
    };

    const filteredProducts = products.filter(p => view === 'vip' ? (p.oldPrice && p.oldPrice > 0) : (!p.oldPrice || p.oldPrice <= 0));

    return (
        <div className="min-h-screen bg-navy text-white p-8 pt-24">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <h1 className="text-4xl font-serif">Panel Administratora</h1>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'products', label: 'Produkty', icon: Package },
                            { id: 'vip', label: 'Pakiety VIP', icon: Star },
                            { id: 'services', label: 'Usługi', icon: Calendar },
                            { id: 'submissions', label: 'Wiadomości', icon: Mail }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border border-gold/20 transition-all ${view === tab.id ? 'bg-gold text-navy-dark' : 'hover:bg-gold/10 text-white/60'}`}
                            >
                                <tab.icon size={16} /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {view !== 'submissions' && (
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-serif">
                            {view === 'products' && 'E-booki i Narzędzia'}
                            {view === 'vip' && 'Pakiety i Oferty Specjalne'}
                            {view === 'services' && 'Konsultacje i Współpraca'}
                        </h2>
                        <button
                            onClick={() => { setIsAdding(!isAdding); setEditingProduct(null); setEditingService(null); }}
                            className="flex items-center gap-2 bg-gold/10 border border-gold text-gold px-4 py-2 rounded-md hover:bg-gold hover:text-navy-dark transition-all"
                        >
                            {isAdding ? 'Zamknij' : <><Plus size={20} /> Dodaj</>}
                        </button>
                    </div>
                )}

                {/* ADD SERVICE FORM */}
                {isAdding && view === 'services' && (
                    <form onSubmit={handleAddService} className="bg-navy-dark border border-gold/30 p-8 rounded-xl mb-8 grid grid-cols-2 gap-4">
                        <input placeholder="Tytuł usługi" value={newService.title} onChange={e => setNewService({ ...newService, title: e.target.value })} className={inputCls} required />
                        <input placeholder="Czas (np. 60 min)" value={newService.duration} onChange={e => setNewService({ ...newService, duration: e.target.value })} className={inputCls} required />
                        <input placeholder="Cena (np. 200 zł)" value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} className={inputCls} required />
                        <textarea placeholder="Krótki opis" value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })} className={`${inputCls} h-20 resize-none`} required />
                        <textarea placeholder="Szczegóły (pod ikoną 'i' - opcjonalnie)" value={newService.details} onChange={e => setNewService({ ...newService, details: e.target.value })} className={`col-span-2 ${inputCls} h-20 resize-none`} />
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-gold/60">🔗 Link do kalendarza Microsoft Bookings (opcjonalnie)</label>
                            <input placeholder="https://outlook.office.com/book/..." value={newService.booking_url} onChange={e => setNewService({ ...newService, booking_url: e.target.value })} className={inputCls} />
                        </div>
                        <button type="submit" className="col-span-2 bg-gold text-navy-dark px-8 py-3 rounded-md font-bold">Zapisz usługę</button>
                    </form>
                )}

                {/* ADD PRODUCT FORM */}
                {isAdding && (view === 'products' || view === 'vip') && (
                    <form onSubmit={handleAddProduct} className="bg-navy-dark border border-gold/30 p-8 rounded-xl mb-8 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-gold/60">Tytuł</label>
                            <input required value={newProduct.title} onChange={e => setNewProduct({ ...newProduct, title: e.target.value })} className={inputCls} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-gold/60">Cena</label>
                            <input type="number" required value={newProduct.price || ''} onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })} className={inputCls} />
                        </div>
                        {view === 'vip' && (
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-gold font-bold">💰 Stara cena (wymagana dla VIP)</label>
                                <input type="number" required value={newProduct.oldPrice} onChange={e => setNewProduct({ ...newProduct, oldPrice: e.target.value })} className={`${inputCls} ring-1 ring-gold/30`} />
                            </div>
                        )}
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-gold/60">Typ</label>
                            <select value={newProduct.type} onChange={e => setNewProduct({ ...newProduct, type: e.target.value })} className={inputCls}>
                                <option>PDF</option><option>ZIP</option><option>LINK</option><option>NOTION</option><option>VIDEO</option>
                            </select>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-gold/60">Opis</label>
                            <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className={`${inputCls} h-20 resize-none`} />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] uppercase tracking-widest text-gold/60">Szczegóły (opcjonalnie)</label>
                            <textarea value={newProduct.details} onChange={e => setNewProduct({ ...newProduct, details: e.target.value })} className={`${inputCls} h-20 resize-none`} />
                        </div>
                        <button type="submit" className="col-span-2 bg-gold text-navy-dark px-8 py-3 rounded-md font-bold">Dodaj do oferty</button>
                    </form>
                )}

                {/* LIST */}
                <div className="grid gap-4">
                    {(view === 'products' || view === 'vip') && filteredProducts.map(p => (
                        <div key={p.id} className="bg-navy-dark/50 border border-gold/10 rounded-lg overflow-hidden transition-all hover:border-gold/30">
                            {editingProduct?.id === p.id ? (
                                /* EDIT MODE - Product */
                                <div className="p-6 grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-widest text-gold/60">Tytuł</label>
                                        <input value={editingProduct.title} onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })} className={inputCls} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-widest text-gold/60">Cena</label>
                                        <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} className={inputCls} />
                                    </div>
                                    {view === 'vip' && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase tracking-widest text-gold/60">Stara cena</label>
                                            <input type="number" value={editingProduct.oldPrice || ''} onChange={e => setEditingProduct({ ...editingProduct, oldPrice: Number(e.target.value) })} className={inputCls} />
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-widest text-gold/60">Typ</label>
                                        <select value={editingProduct.type} onChange={e => setEditingProduct({ ...editingProduct, type: e.target.value })} className={inputCls}>
                                            <option>PDF</option><option>ZIP</option><option>LINK</option><option>NOTION</option><option>VIDEO</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] uppercase tracking-widest text-gold/60">Opis</label>
                                        <textarea value={editingProduct.description} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} className={`${inputCls} h-20 resize-none`} />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] uppercase tracking-widest text-gold/60">Szczegóły</label>
                                        <textarea value={editingProduct.details || ''} onChange={e => setEditingProduct({ ...editingProduct, details: e.target.value })} className={`${inputCls} h-16 resize-none`} />
                                    </div>
                                    <div className="col-span-2 flex gap-3 justify-end">
                                        <button onClick={() => setEditingProduct(null)} className="flex items-center gap-1 px-4 py-2 border border-white/10 rounded-md text-white/40 hover:text-white text-sm"><X size={14} /> Anuluj</button>
                                        <button onClick={handleSaveProduct} className="flex items-center gap-1 px-4 py-2 bg-gold text-navy-dark rounded-md font-bold text-sm"><Check size={14} /> Zapisz</button>
                                    </div>
                                </div>
                            ) : (
                                /* VIEW MODE - Product */
                                <div className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-gold/5 flex items-center justify-center rounded-md text-gold">
                                            {p.type === 'PDF' && <FileText size={20} />}
                                            {p.type === 'ZIP' && <Package size={20} />}
                                            {p.type === 'LINK' && <LinkIcon size={20} />}
                                            {p.type === 'VIDEO' && <Video size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-lg">{p.title}</h3>
                                            <p className="text-sm text-white/40">{p.type} • {p.description?.substring(0, 60)}...</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            {p.oldPrice ? <div className="text-sm text-white/20 line-through">{p.oldPrice} zł</div> : null}
                                            <div className="text-2xl font-serif text-gold">{p.price} zł</div>
                                        </div>
                                        <button onClick={() => { setEditingProduct({ ...p }); setIsAdding(false); }} className="p-2 text-white/20 hover:text-gold transition-colors" title="Edytuj"><Pencil size={18} /></button>
                                        <button onClick={() => handleDelete('products', p.id)} className="p-2 text-white/20 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {view === 'services' && services.map(s => (
                        <div key={s.id} className="bg-navy-dark/50 border border-gold/10 rounded-lg overflow-hidden transition-all hover:border-gold/30">
                            {editingService?.id === s.id ? (
                                /* EDIT MODE - Service */
                                <div className="p-6 grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-widest text-gold/60">Tytuł</label>
                                        <input value={editingService.title} onChange={e => setEditingService({ ...editingService, title: e.target.value })} className={inputCls} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-widest text-gold/60">Czas trwania</label>
                                        <input value={editingService.duration} onChange={e => setEditingService({ ...editingService, duration: e.target.value })} className={inputCls} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-widest text-gold/60">Cena</label>
                                        <input value={editingService.price} onChange={e => setEditingService({ ...editingService, price: e.target.value })} className={inputCls} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-widest text-gold/60">Opis</label>
                                        <textarea value={editingService.description} onChange={e => setEditingService({ ...editingService, description: e.target.value })} className={`${inputCls} h-20 resize-none`} />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] uppercase tracking-widest text-gold/60">Szczegóły (opcjonalnie)</label>
                                        <textarea value={editingService.details || ''} onChange={e => setEditingService({ ...editingService, details: e.target.value })} className={`${inputCls} h-16 resize-none`} />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] uppercase tracking-widest text-gold font-bold">🔗 Link do kalendarza Microsoft Bookings</label>
                                        <input value={editingService.booking_url || ''} onChange={e => setEditingService({ ...editingService, booking_url: e.target.value })} placeholder="https://outlook.office.com/book/..." className={`${inputCls} border-gold/40 focus:border-gold ring-1 ring-gold/10`} />
                                        <p className="text-[10px] text-white/30">Wklej link z panelu Microsoft Bookings → Strona rezerwacji → Kopiuj link</p>
                                    </div>
                                    <div className="col-span-2 flex gap-3 justify-end">
                                        <button onClick={() => setEditingService(null)} className="flex items-center gap-1 px-4 py-2 border border-white/10 rounded-md text-white/40 hover:text-white text-sm"><X size={14} /> Anuluj</button>
                                        <button onClick={handleSaveService} className="flex items-center gap-1 px-4 py-2 bg-gold text-navy-dark rounded-md font-bold text-sm"><Check size={14} /> Zapisz</button>
                                    </div>
                                </div>
                            ) : (
                                /* VIEW MODE - Service */
                                <div className="p-6 flex items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-lg text-gold">{s.title}</h3>
                                        <p className="text-sm text-white/60">{s.duration} • {s.description}</p>
                                        {s.booking_url ? (
                                            <a href={s.booking_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold/50 hover:text-gold flex items-center gap-1 mt-1">
                                                <LinkIcon size={10} /> {s.booking_url.substring(0, 55)}...
                                            </a>
                                        ) : (
                                            <span className="text-xs text-white/20 italic mt-1 block">Brak linku kalendarza — kliknij ✏️ aby dodać</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-6 ml-6">
                                        <div className="text-2xl font-serif text-gold whitespace-nowrap">{s.price}</div>
                                        <button onClick={() => { setEditingService({ ...s }); setIsAdding(false); }} className="p-2 text-white/20 hover:text-gold transition-colors" title="Edytuj"><Pencil size={18} /></button>
                                        <button onClick={() => handleDelete('services', s.id)} className="p-2 text-white/20 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {view === 'submissions' && submissions.map(s => (
                        <div key={s.id} className="bg-navy-dark border border-gold/20 p-8 rounded-xl">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-serif text-gold mb-1">{s.subject || 'Brak tematu'}</h3>
                                    <div className="flex items-center gap-2 text-sm text-white/50">
                                        <Mail size={14} /> {s.name} ({s.email})
                                    </div>
                                </div>
                                <div className="text-xs text-white/20">{new Date(s.created_at).toLocaleString('pl-PL')}</div>
                            </div>
                            <p className="text-white/80 italic bg-navy/40 p-4 rounded-lg">"{s.message}"</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
