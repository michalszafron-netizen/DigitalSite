import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Calendar, Mail, FileText, Video, Package, Link as LinkIcon, ChevronRight, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminDashboard from './components/AdminDashboard';

const API = window.location.hostname === 'localhost' ? 'http://localhost:3002' : '';

// --- Types ---

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  type: string;
  category: string;
  details?: string;
}

// --- Components ---

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 bg-navy/80 backdrop-blur-md border-b border-gold/10">
    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <Link to="/" className="text-2xl font-serif font-bold tracking-tight">
        NextStep<span className="text-gold">Kariera</span>
      </Link>
      <div className="hidden md:flex gap-8 text-sm font-medium tracking-wide items-center">
        <a href="/#about" className="hover:text-gold transition-colors underline-offset-8 hover:underline">O FIRMIE</a>
        <a href="/#services" className="hover:text-gold transition-colors underline-offset-8 hover:underline">USŁUGI</a>
        <a href="/#store" className="hover:text-gold transition-colors underline-offset-8 hover:underline">SKLEP</a>
        <a href="/#contact" className="hover:text-gold transition-colors underline-offset-8 hover:underline">KONTAKT</a>
        <Link to="/admin" className="text-gold/30 hover:text-gold transition-colors">ADMIN</Link>
        <button className="btn-primary py-2 text-xs">SKONTAKTUJ SIĘ</button>
      </div>
    </div>
  </nav>
);

const LandingPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [expandedInfo, setExpandedInfo] = useState<{ type: 'product' | 'service', id: number } | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<any | null>(null);
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Check for success redirect from P24 or Stripe
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('session') || urlParams.get('session_id')) {
      setPurchaseStatus('success');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    fetch(`${API}/api/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error('Fetch error (products):', err));

    fetch(`${API}/api/services`)
      .then(res => res.json())
      .then(data => setServices(data))
      .catch(err => console.error('Fetch error (services):', err));
  }, []);

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus('sending');
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) setFormStatus('success');
      else setFormStatus('error');
    } catch (err) {
      setFormStatus('error');
    }
  };

  const DEFAULT_BOOKING_URL = 'https://outlook.office.com/book/Spotkanie@kryptopit.onmicrosoft.com/';

  const handleBooking = (url?: string) => {
    const bookingLink = url || DEFAULT_BOOKING_URL;
    if (window.location.protocol === 'https:') {
      setBookingUrl(bookingLink);
    } else {
      window.open(bookingLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePurchase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPurchaseStatus('processing');
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;

    try {
      // Domyślnie używamy Stripe (łatwiejszy dla osób fizycznych / testów)
      const res = await fetch(`${API}/api/payments/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: checkoutItem.price,
          description: checkoutItem.title,
          email,
          clientName: name,
          productId: checkoutItem.id
        }),
      });

      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setPurchaseStatus('error');
      }
    } catch (err) {
      setPurchaseStatus('error');
    }
  };

  return (
    <>
      <AnimatePresence>
        {checkoutItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-navy/95 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-navy-dark border border-gold/30 p-10 rounded-3xl max-w-md w-full relative shadow-2xl"
            >
              <button
                onClick={() => setCheckoutItem(null)}
                className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold/20">
                  <Package className="text-gold" size={32} />
                </div>
                <h3 className="text-2xl font-serif text-white">Finalizacja zakupu</h3>
                <p className="text-white/40 text-sm mt-1">{checkoutItem.title}</p>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl mb-8 border border-white/5">
                {purchaseStatus === 'success' ? (
                  <div className="text-center py-4">
                    <div className="text-gold mb-2 font-serif text-xl">Płatność zakończona!</div>
                    <p className="text-white/40 text-xs">Sprawdź swoją skrzynkę e-mail.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/40">Cena:</span>
                      <span className="text-xl font-serif text-gold">{checkoutItem.price} zł</span>
                    </div>
                    <div className="text-[10px] text-white/20 uppercase tracking-widest text-right">Metoda: Bezpieczna płatność (BLIK, Karta, GPay)</div>
                  </>
                )}
              </div>

              <form onSubmit={handlePurchase} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">E-mail (na ten adres wyślemy plik)</label>
                  <input name="email" type="email" required placeholder="twoj@email.com" className="w-full bg-navy border border-white/10 p-4 rounded-xl focus:border-gold outline-none transition-all text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Imię i Nazwisko</label>
                  <input name="name" type="text" required placeholder="Jan Kowalski" className="w-full bg-navy border border-white/10 p-4 rounded-xl focus:border-gold outline-none transition-all text-white" />
                </div>

                <button
                  type="submit"
                  disabled={purchaseStatus === 'processing'}
                  className="w-full btn-primary !py-5 text-lg flex items-center justify-center gap-3 disabled:opacity-50 group hover:shadow-[0_0_30px_-5px_rgba(212,175,55,0.4)]"
                >
                  {purchaseStatus === 'processing' ? 'Łączenie...' : <>Zapłać bezpiecznie <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" /></>}
                </button>

                {purchaseStatus === 'error' && (
                  <p className="text-red-400 text-xs text-center">Wystąpił błąd podczas inicjowania płatności. Sprawdź konfigurację serwera.</p>
                )}

                <p className="text-[9px] text-center text-white/20 leading-relaxed">
                  Klikając przycisk, zostaniesz przekierowany do bezpiecznej płatności Stripe. Po zaksięgowaniu wpłaty, produkt zostanie automatycznie wysłany na Twój e-mail.
                </p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {expandedInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedInfo(null)}
            className="fixed inset-0 z-[100] bg-navy/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-navy-dark border border-gold/30 p-8 rounded-2xl max-w-lg w-full relative shadow-2xl"
            >
              <button
                onClick={() => setExpandedInfo(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-gold transition-colors"
              >
                <X size={24} />
              </button>
              <h3 className="text-2xl font-serif mb-4 text-gold">Szczegóły</h3>
              <p className="text-white/80 leading-relaxed italic">
                {expandedInfo.type === 'service'
                  ? services.find(s => s.id === expandedInfo.id)?.details
                  : products.find(p => p.id === expandedInfo.id)?.details}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bookingUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBookingUrl(null)}
            className="fixed inset-0 z-[110] bg-navy/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-navy-dark border border-gold/30 rounded-2xl w-full max-w-6xl h-[90vh] relative shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/5 bg-navy-dark">
                <h3 className="text-xl font-serif text-gold">Rezerwacja Terminu Online</h3>
                <button
                  onClick={() => setBookingUrl(null)}
                  className="text-white/40 hover:text-gold transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-grow bg-white">
                <iframe
                  src={bookingUrl}
                  className="w-full h-full border-none"
                  title="Microsoft Bookings"
                ></iframe>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-gold font-medium tracking-[0.2em] text-sm uppercase mb-4 block">Joanna Nowacka — Mentorka Kariery</span>
            <h1 className="text-5xl md:text-7xl leading-[1.1] mb-8">
              Zbuduj karierę, na którą <span className="italic font-light">zasługujesz.</span>
            </h1>
            <p className="text-xl text-white/70 mb-10 max-w-xl leading-relaxed">
              Pomagam profesjonalistom zdobyć wymarzoną pracę w IT i nowoczesnych usługach dzięki sprawdzonym strategiom rekrutacyjnym.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#services" className="btn-primary text-center text-lg">Zarezerwuj spotkanie</a>
              <a href="#store" className="px-8 py-4 border border-gold/30 rounded-md font-semibold text-center hover:bg-gold/5 transition-colors">Zobacz produkty</a>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative aspect-[4/5] bg-navy-light rounded-2xl overflow-hidden border border-gold/10 shadow-2xl"
          >
            <img
              src="/Portrait.jpeg"
              alt="Joanna Nowacka"
              className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent opacity-60"></div>
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square bg-gold/5 rounded-full absolute -inset-10 animate-pulse"></div>
            <div className="relative z-10 p-12 bg-navy-dark border border-gold/20 rounded-2xl shadow-2xl">
              <h3 className="text-4xl font-serif text-gold mb-6">Misja & Wizja</h3>
              <p className="text-white/70 leading-relaxed mb-6">
                Wierzę, że praca to nie tylko "odklepanie" 8 godzin, ale przestrzeń do nieustannego wzrostu. Moim celem jest skracanie dystansu między Twoimi ambicjami a realnym zatrudnieniem w najlepszych firmach technologicznych.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-3xl font-serif text-gold">500+</div>
                  <div className="text-xs uppercase tracking-widest text-white/40">Zadowolonych klientów</div>
                </div>
                <div>
                  <div className="text-3xl font-serif text-gold">98%</div>
                  <div className="text-xs uppercase tracking-widest text-white/40">Skuteczności rekrutacyjnej</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl mb-8 font-serif leading-tight">Tworzymy kariery, które <span className="text-gold">mają znaczenie.</span></h2>
            <p className="text-lg text-white/60 mb-8 leading-relaxed">
              Zostań architektem własnego sukcesu. W <strong>NextStep Kariera</strong> nie tylko poprawiamy CV – my projektujemy Twoją przyszłość zawodową na nowo. Łączymy psychologię biznesu z twardymi danymi z rynku IT, abyś zawsze był o krok przed konkurencją.
            </p>
            <p className="text-lg text-white/60 mb-10 leading-relaxed">
              Dzięki mojemu autorskiemu systemowi mapowania kompetencji, odkrywamy talenty, o których istnieniu mogłeś zapomnieć. To nie jest kolejny kurs – to transformacja, która pozwala Ci wejść do gry z zupełnie innymi kartami.
            </p>
            <a href="#contact" className="inline-flex items-center gap-2 text-gold font-bold hover:gap-4 transition-all">
              DOWIEDZ SIĘ WIĘCEJ <ChevronRight size={20} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-24 px-6 bg-navy-dark/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl mb-4">Współpraca Indywidualna</h2>
            <div className="w-20 h-1 bg-gold mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service) => (
              <div key={service.id} className="card-editorial flex flex-col items-center text-center relative">
                {service.details && (
                  <button
                    onClick={() => setExpandedInfo({ type: 'service', id: service.id })}
                    className="absolute top-4 right-4 text-white/20 hover:text-gold transition-colors"
                    title="Zobacz szczegóły"
                  >
                    <Info size={18} />
                  </button>
                )}
                <Calendar className="text-gold mb-6 w-10 h-10" />
                <h3 className="text-2xl mb-2">{service.title}</h3>
                <span className="text-sm text-white/50 mb-4">{service.duration}</span>
                <div className="text-3xl font-serif text-gold mb-6">{service.price}</div>
                <p className="text-white/60 mb-8 flex-grow">{service.description}</p>
                <button
                  onClick={() => handleBooking(service.booking_url)}
                  className="w-full btn-primary !bg-white/5 !text-white border border-gold/20 hover:!bg-gold hover:!text-navy-dark font-medium"
                >
                  Zarezerwuj
                </button>
              </div>
            ))}
            {services.length === 0 && (
              <div className="col-span-3 text-center py-10 text-white/20">Ładowanie usług...</div>
            )}
          </div>
        </div>
      </section>

      {/* Store */}
      <section id="store" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
            <div>
              <h2 className="text-4xl md:text-5xl mb-4">Biblioteka Narzędzi</h2>
              <p className="text-white/50">Gotowe szablony, e-booki i kursy, które przyspieszą Twój sukces.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.filter(p => !p.oldPrice || p.oldPrice <= 0).map((product) => (
              <div key={product.id} className="bg-navy-dark/40 border border-gold/5 p-6 rounded-lg group hover:bg-navy-light transition-all relative">
                {product.details && (
                  <button
                    onClick={() => setExpandedInfo({ type: 'product', id: product.id })}
                    className="absolute top-4 right-4 text-white/10 hover:text-gold transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Zobacz szczegóły"
                  >
                    <Info size={16} />
                  </button>
                )}
                <div className="w-12 h-12 bg-white/5 rounded-md flex items-center justify-center mb-6 group-hover:bg-gold/20 group-hover:text-gold transition-all">
                  {(product.type === 'PDF' || product.type === 'NOTION') && <FileText size={24} />}
                  {product.type === 'ZIP' && <Package size={24} />}
                  {(product.type === 'LINK' || product.type === 'NOTION') && <LinkIcon size={24} />}
                  {product.type === 'VIDEO' && <Video size={24} />}
                </div>
                <h4 className="text-xl mb-4 leading-snug">{product.title}</h4>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-2xl font-serif text-gold">{product.price} zł</span>
                  <button
                    onClick={() => setCheckoutItem(product)}
                    className="text-white/40 hover:text-gold transition-colors flex items-center gap-2 text-sm uppercase tracking-widest font-bold"
                  >
                    Kup <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12">
            {products.filter(p => p.oldPrice && p.oldPrice > 0).map(bundle => (
              <div key={bundle.id} className="bg-gradient-to-r from-navy-dark to-gold/10 border border-gold/40 p-10 rounded-2xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="text-center md:text-left">
                    <span className="bg-gold/20 text-gold px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 inline-block">Najlepsza Opcja</span>
                    <h3 className="text-4xl mb-4">{bundle.title}</h3>
                    <p className="text-white/60 max-w-lg italic">Wszystkie e-booki, szablony CV, bazy danych i nagrania w jednej, kompleksowej paczce.</p>
                  </div>
                  <div className="text-center">
                    <div className="text-white/40 line-through text-xl mb-1">{bundle.oldPrice} zł</div>
                    <div className="text-5xl font-serif text-gold mb-8">{bundle.price} zł</div>
                    <button
                      onClick={() => setCheckoutItem(bundle)}
                      className="btn-primary px-12 py-5 text-xl"
                    >
                      Chcę pakiet VIP
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 px-6 bg-navy-dark">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <h2 className="text-4xl mb-6">Masz pytania?</h2>
              <p className="text-white/60 mb-10">Jeśli nie wiesz, która usługa będzie dla Ciebie najlepsza, napisz do mnie. Odpowiem najszybciej jak to możliwe.</p>
              <div className="space-y-6">
                <div className="flex gap-4 items-center">
                  <Mail className="text-gold" />
                  <span>kontakt@nextstepkariera.pl</span>
                </div>
              </div>
            </div>
            {formStatus === 'success' ? (
              <div className="bg-gold/10 border border-gold p-12 rounded-xl text-center">
                <h3 className="text-2xl text-gold mb-4 font-serif">Wiadomość wysłana!</h3>
                <p>Odezwiemy się do Ciebie wkrótce.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <input required name="name" className="w-full bg-white/5 border border-gold/10 p-4 rounded-md focus:outline-none focus:border-gold" placeholder="Imię i Nazwisko" />
                <input required name="email" type="email" className="w-full bg-white/5 border border-gold/10 p-4 rounded-md focus:outline-none focus:border-gold" placeholder="Twój E-mail" />
                <input required name="subject" className="w-full bg-white/5 border border-gold/10 p-4 rounded-md focus:outline-none focus:border-gold" placeholder="Temat" />
                <textarea required name="message" className="w-full bg-white/5 border border-gold/10 p-4 rounded-md focus:outline-none focus:border-gold h-32" placeholder="Wiadomość"></textarea>
                <button disabled={formStatus === 'sending'} className="w-full btn-primary disabled:opacity-50">
                  {formStatus === 'sending' ? 'Wysyłanie...' : 'Wyślij wiadomość'}
                </button>
                {formStatus === 'error' && <p className="text-red-400 text-sm">Wystąpił błąd. Spróbuj ponownie później.</p>}
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-navy selection:bg-gold selection:text-navy-dark">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>

        <footer className="py-12 px-6 border-t border-gold/10 text-center text-white/30 text-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="font-serif text-xl font-bold">
              NextStep<span className="text-gold">Kariera</span>
            </div>
            <div>&copy; 2026 Joanna Nowacka. Wszelkie prawa zastrzeżone.</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-gold transition-colors">Regulamin</a>
              <a href="#" className="hover:text-gold transition-colors">Polityka Prywatności</a>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
