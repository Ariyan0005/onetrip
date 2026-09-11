import { useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, Bike, CarFront, Check, ChevronDown, Globe2, Hotel, MapPinned, Menu, Plane, Search, ShieldCheck, Sparkles, Users, X } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { WidgetRenderer } from '@/components/widget-renderer';
import { Toaster } from '@/components/ui/toaster';
import Admin from '@/pages/admin';
import NotFound from '@/pages/not-found';
import { getPublicWidgets, WidgetApiError } from '@/lib/widget-api';
import type { TravelWidget, WidgetCategory } from '@/lib/widget-store';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
const logo = `${import.meta.env.BASE_URL}onetrip-logo.png`;
const languages = ['English', 'Español', 'Français', 'Deutsch', 'Italiano', 'Português', 'Nederlands', 'Türkçe', 'Ελληνικά', '中文', '日本語', '한국어', 'العربية', 'हिन्दी', 'ภาษาไทย', 'Bahasa Indonesia', 'Polski', 'Svenska', 'Dansk', 'Norsk', 'Suomi', 'Čeština', 'Magyar', 'עברית', 'Tiếng Việt', 'Українська'];

interface IconicSpot {
  city: string;
  country: string;
  spotName: string;
  tag: string;
  image: string;
  highlight: string;
}

const iconicSpots: IconicSpot[] = [
  {
    city: 'Lauterbrunnen',
    country: 'Switzerland',
    spotName: 'Staubbach Falls & Alpine Valley',
    tag: 'Swiss Alps Sanctuary',
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
    highlight: '72 roaring glacial waterfalls cascading down sheer limestone cliffs in the heart of the Bernese Oberland.',
  },
  {
    city: 'Kyoto',
    country: 'Japan',
    spotName: 'Arashiyama Bamboo Forest & Sagano',
    tag: 'Ancient Cultural Haven',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    highlight: 'Soaring jade-green bamboo canopies, centuries-old Zen temples, and tranquil stone path walks.',
  },
  {
    city: 'Santorini',
    country: 'Greece',
    spotName: 'Oia Cliffs & Aegean Caldera',
    tag: 'Aegean Island Gem',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
    highlight: 'Whitewashed cliffside villas, cobalt-blue domes, and world-famous golden sunsets melting into the sea.',
  },
  {
    city: 'Ubud & Bali',
    country: 'Indonesia',
    spotName: 'Tegallalang Emerald Terraces',
    tag: 'Tropical Nature',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
    highlight: 'Cascading verdant rice paddies carved by ancient subak irrigation, shrouded in morning rainforest mist.',
  },
  {
    city: 'Banff',
    country: 'Canada',
    spotName: 'Moraine Lake & Valley of the Ten Peaks',
    tag: 'Canadian Rockies',
    image: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=1200&q=80',
    highlight: 'Crystalline turquoise glacial water framed by rugged snow-capped peaks and towering pine forests.',
  },
  {
    city: 'Cappadocia',
    country: 'Turkey',
    spotName: 'Göreme Valley Sunrise Balloons',
    tag: 'Surreal Landscapes',
    image: 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?auto=format&fit=crop&w=1200&q=80',
    highlight: 'Hundreds of vibrant hot-air balloons rising over whimsical fairy chimneys and ancient cave dwellings.',
  },
];

interface FAQItem {
  category: 'Flights' | 'Hotels' | 'Transfers' | 'Tours';
  q: string;
  a: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Flights',
    q: 'When is the best time to book cheap flight tickets?',
    a: 'Generally, booking 3 to 8 weeks before domestic flights and 2 to 4 months before international departures provides the most competitive airfares. Tuesdays and Wednesdays frequently offer lower rates compared to peak weekend travel days.',
  },
  {
    category: 'Flights',
    q: 'Does OneTripz charge any booking or transaction fees?',
    a: 'Never. OneTripz is 100% free for travelers. There are zero hidden fees, markups, or service charges. You compare real-time prices here and complete your reservation directly on verified airline or certified agency partner platforms.',
  },
  {
    category: 'Hotels',
    q: 'How can I ensure there are no surprise fees on hotel bookings?',
    a: 'Always check whether local city taxes or resort fees are included in the checkout summary. We connect you with top global platforms that clearly state cancellation policies and breakdown taxes upfront before you pay.',
  },
  {
    category: 'Hotels',
    q: 'Can I book hotels with free cancellation?',
    a: 'Yes. Most partner properties provide flexible booking options with free cancellation up to 24 to 48 hours before check-in, giving you peace of mind if your itinerary changes.',
  },
  {
    category: 'Transfers',
    q: 'Why should I pre-book an airport transfer or rental car?',
    a: 'Pre-booking airport transfers or car rentals guarantees a fixed upfront rate, eliminating long airport taxi queues, language barriers, and peak surge pricing when you arrive in an unfamiliar city.',
  },
  {
    category: 'Transfers',
    q: 'How do airport pickup meet-and-greet services work?',
    a: 'Professional transfer drivers track your flight arrival in real time. They meet you inside the arrivals hall holding a sign with your name, assist with your luggage, and provide direct door-to-door transport.',
  },
  {
    category: 'Tours',
    q: 'Why is it better to book tour guides and attractions in advance?',
    a: 'Popular landmarks (such as museums, observation decks, and historical ruins) often enforce timed entry slots or sell out days in advance. Pre-booking secures your entry and usually includes skip-the-line privileges.',
  },
  {
    category: 'Tours',
    q: 'Do I need printed vouchers for tours and experience tickets?',
    a: 'In almost all destinations, mobile digital e-vouchers on your smartphone are fully accepted at the turnstile or by your tour guide—no paper printing required.',
  },
];

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [language, setLanguage] = useState('English');
  const [toast, setToast] = useState('');
  const [activeCategory, setActiveCategory] = useState<WidgetCategory>('flights');
  const [widgets, setWidgets] = useState<TravelWidget[]>([]);
  const [widgetLoading, setWidgetLoading] = useState(true);
  const [widgetError, setWidgetError] = useState('');

  useEffect(() => {
    const favicon = document.querySelector<HTMLLinkElement>('link[data-onetrip-favicon]') || document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    favicon.href = logo;
    favicon.dataset.onetripFavicon = 'true';
    if (!favicon.parentNode) document.head.appendChild(favicon);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getPublicWidgets()
      .then((nextWidgets) => {
        if (cancelled) return;
        setWidgets(nextWidgets);
        setWidgetError('');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setWidgetError(error instanceof WidgetApiError ? error.message : 'Widget service is unavailable.');
      })
      .finally(() => {
        if (!cancelled) setWidgetLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string) => setToast(message);

  const chooseDestination = (destination: string) => {
    document.getElementById('search')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast(`${destination} selected. Find your flights below.`);
  };

  return (
    <main className="ot-page" data-testid="page-home">
      <header className="ot-nav">
        <div className="ot-container ot-nav-inner">
          <a href="#top" aria-label="OneTripz home" data-testid="link-logo"><img src={logo} alt="OneTripz" className="ot-logo" /></a>
          <nav className="ot-nav-links" aria-label="Primary navigation">
            <a href="#search" data-testid="link-flights">Flights</a>
            <a href="#destinations" data-testid="link-destinations">Destinations</a>
            <a href="#faq" data-testid="link-faq">FAQ</a>
            <a href="#why-onetrip" data-testid="link-why-onetrip">Why OneTripz</a>
          </nav>
          <div className="ot-nav-actions">
            <div style={{ position: 'relative' }}>
              <button className="ot-language" onClick={() => setLanguageOpen((open) => !open)} aria-expanded={languageOpen} data-testid="button-language">
                <Globe2 size={16} strokeWidth={1.8} /><span>{language}</span><ChevronDown size={14} />
              </button>
              {languageOpen && <LanguagePopover language={language} onSelect={(next) => { setLanguage(next); setLanguageOpen(false); showToast(`Language preference set to ${next}.`); }} />}
            </div>
            <a className="ot-admin-link" href={`${import.meta.env.BASE_URL}admin-setup`}>Admin</a>
            <a className="ot-primary-btn" href="#search" data-testid="link-start-planning">Start planning <ArrowRight size={16} /></a>
            <button className="ot-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} data-testid="button-mobile-menu">{menuOpen ? <X size={23} /> : <Menu size={23} />}</button>
          </div>
        </div>
        {menuOpen && <div className="ot-mobile-menu">
          <a href="#search" onClick={() => setMenuOpen(false)} data-testid="mobile-link-search">Search a trip</a>
          <a href="#destinations" onClick={() => setMenuOpen(false)} data-testid="mobile-link-destinations">Destinations</a>
          <a href="#faq" onClick={() => setMenuOpen(false)} data-testid="mobile-link-faq">FAQ</a>
          <a href="#why-onetrip" onClick={() => setMenuOpen(false)} data-testid="mobile-link-why">Why OneTripz</a>
        </div>}
      </header>

      <section className="ot-hero" id="top">
        <div className="ot-container">
          <div className="ot-hero-header">
            <h1 className="ot-hero-title">Compare flight tickets,<br className="ot-break-mobile" /> hotels & tours worldwide</h1>
          </div>

           <div className="ot-search-wrap" id="search" aria-label="Trip search">
             <div className="ot-search-panel ot-travelpayouts-panel" data-testid="panel-travelpayouts-widget">
               <div className="ot-widget-tabs" role="tablist" aria-label="Travel booking categories">
                 {[
                   { value: 'flights' as const, label: 'Flights', icon: Plane },
                   { value: 'hotels' as const, label: 'Hotels', icon: Hotel },
                   { value: 'cars' as const, label: 'Cars', icon: CarFront },
                   { value: 'bikes' as const, label: 'Bikes', icon: Bike },
                 ].map(({ value, label, icon: Icon }) => (
                   <button className={`ot-widget-tab${activeCategory === value ? ' is-active' : ''}`} type="button" role="tab" aria-selected={activeCategory === value} key={value} onClick={() => setActiveCategory(value)}>
                     <Icon size={16} /> {label}
                   </button>
                 ))}
               </div>
               <div className="ot-tpwl-widget-host" data-testid="container-tpwl-host">
                {widgets.filter((widget) => widget.active && widget.category === activeCategory && widget.placement === 'hero').map((widget) => (
                   <div className="ot-widget-instance" key={widget.id}>
                     <WidgetRenderer widget={widget} />
                   </div>
                 ))}
                 {!widgetLoading && !widgets.some((widget) => widget.active && widget.category === activeCategory && widget.placement === 'hero') && (
                   <WidgetEmptyState category={activeCategory} error={widgetError} />
                 )}
                 {widgetLoading && <div className="ot-widget-loading">Loading live widget configuration…</div>}
               </div>

              {/* Title & Trust Info Under the Search Widget */}
              <div className="ot-widget-footer">
                <div className="ot-widget-footer-main">
                  <p className="ot-section-kicker ot-mono">Where do you want to fly?</p>
                  <p className="ot-widget-sub">Search real-time airfares and hotel deals across 500+ verified airlines with zero booking fees.</p>
                </div>
                <div className="ot-hero-note"><ShieldCheck size={14} /><span>Official rates &bull; No hidden markups</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ot-section ot-container" id="destinations" aria-labelledby="destinations-heading">
        <div className="ot-section-top">
          <div>
            <p className="ot-section-kicker ot-mono">Iconic World Landmarks & Spots</p>
            <h2 id="destinations-heading" className="ot-display">Places that stay with you forever.</h2>
          </div>
          <p className="ot-section-intro">Experience the world's most breathtaking natural wonders, historic sanctuaries, and dramatic landscapes.</p>
        </div>
        <div className="ot-photo-grid">
          {iconicSpots.map((spot, index) => (
            <article
              className="ot-photo-card"
              key={spot.spotName}
              data-testid={`spot-card-${index}`}
              onClick={() => {
                document.getElementById('search')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                showToast(`Search flights & stays to ${spot.city}, ${spot.country}`);
              }}
            >
              <div className="ot-photo-viewport">
                <img
                  src={spot.image}
                  alt={`${spot.spotName} in ${spot.city}, ${spot.country}`}
                  loading="lazy"
                  className="ot-photo-img"
                />
                <div className="ot-photo-overlay" />
                <span className="ot-photo-tag">{spot.tag}</span>
              </div>
              <div className="ot-photo-details">
                <div className="ot-photo-meta">
                  <span className="ot-photo-country">{spot.country}</span>
                  <span className="ot-photo-city">&bull; {spot.city}</span>
                </div>
                <h3 className="ot-photo-title">{spot.spotName}</h3>
                <p className="ot-photo-highlight">{spot.highlight}</p>
                <div className="ot-photo-action">
                  <span>Explore flights & hotels</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
       <WidgetPlacementSection widgets={widgets} placement="after-destinations" />

      <section className="ot-section ot-editorial" id="why-onetrip">
        <div className="ot-container ot-editorial-grid">
          <div><p className="ot-section-kicker ot-mono">Less noise. More north star.</p><h2 className="ot-display">Plans should leave room for anticipation.</h2><p className="ot-editorial-copy">OneTripz brings the useful bits together without making you feel like a transaction. Find the route, the room, and the small details that make a place yours.</p><ul className="ot-editorial-list"><li><span>01</span><div><strong>See the whole picture</strong><br />Compare the things that matter before you commit.</div></li><li><span>02</span><div><strong>Trust your next step</strong><br />Clear information, familiar partners, no surprise turns.</div></li><li><span>03</span><div><strong>Keep the good part</strong><br />Less tab-switching. More daydreaming.</div></li></ul></div>
          <div className="ot-quote"><div className="ot-quote-mark">“</div><blockquote>Travel is better when the logistics quietly disappear.</blockquote><cite>— The OneTripz field note, issue 01</cite></div>
        </div>
      </section>

      <section className="ot-section ot-container" aria-labelledby="features-heading">
        <div className="ot-section-top"><div><p className="ot-section-kicker ot-mono">A better starting point</p><h2 id="features-heading" className="ot-display">Good journeys begin with clarity.</h2></div></div>
        <div className="ot-feature-grid">
          <article className="ot-feature"><div className="ot-feature-icon"><Search size={23} /></div><h3>One search, many routes</h3><p>Flights, stays, experiences, and airport transfers — lined up so the choice feels human.</p></article>
          <article className="ot-feature"><div className="ot-feature-icon"><Sparkles size={23} /></div><h3>Details worth knowing</h3><p>Helpful context sits beside the price, so “cheaper” never has to mean “unclear.”</p></article>
          <article className="ot-feature"><div className="ot-feature-icon"><Users size={23} /></div><h3>Made for real travelers</h3><p>Whether it is your first long-haul trip or your forty-first, the next step stays simple.</p></article>
        </div>
      </section>
       <WidgetPlacementSection widgets={widgets} placement="before-faq" />

      <section className="ot-section ot-container" id="faq" aria-labelledby="faq-heading">
        <div className="ot-section-top">
          <div>
            <p className="ot-section-kicker ot-mono">Everything you need to know</p>
            <h2 id="faq-heading" className="ot-display">Frequently asked questions.</h2>
          </div>
          <p className="ot-section-intro">
            Common questions about finding the best flight tickets, trusted booking partners, and travel planning with OneTripz.
          </p>
        </div>
        <div className="ot-faq-grid">
          {faqs.map((faq, idx) => (
            <article className="ot-faq-card" key={idx} data-testid={`card-faq-${idx}`}>
              <div className="ot-faq-header">
                <span className="ot-faq-category">{faq.category}</span>
              </div>
              <h3>{faq.q}</h3>
              <p>{faq.a}</p>
            </article>
          ))}
        </div>
       </section>

      <section className="ot-cta">
        <div className="ot-container ot-cta-inner"><h2 className="ot-display">There is a whole world past the open tabs.</h2><div><p>Close the research spiral. Start with one destination and let the rest unfold.</p><a className="ot-primary-btn" href="#search" data-testid="link-cta-search">Start with a search <ArrowRight size={16} /></a></div></div>
      </section>

       <WidgetPlacementSection widgets={widgets} placement="footer" />
       <footer className="ot-footer">
        <div className="ot-container"><div className="ot-footer-grid"><div><img src={logo} alt="OneTripz" className="ot-footer-logo" /><p>A clearer way to compare and book the parts of a trip that make it yours.</p></div><div><h4>Explore</h4><a href="#search" data-testid="footer-link-search">Search flights</a><a href="#destinations" data-testid="footer-link-destinations">Destinations</a><a href="#faq" data-testid="footer-link-faq">FAQ</a><a href="#why-onetrip" data-testid="footer-link-about">Why OneTripz</a></div><div><h4>Travel well</h4><a href="#search" data-testid="footer-link-flights">Cheap flights</a><a href="#search" data-testid="footer-link-hotels">Hotels</a><a href="#search" data-testid="footer-link-transfers">Airport transfers</a></div><div><h4>Notes</h4><a href="#top" onClick={() => showToast('The OneTripz journal is coming soon.')} data-testid="footer-link-journal">The journal</a><a href="#top" onClick={() => showToast('Support is ready when you need it.')} data-testid="footer-link-support">Support</a><a href="#top" onClick={() => showToast('Privacy is part of the trip.')} data-testid="footer-link-privacy">Privacy</a></div></div><div className="ot-footer-bottom"><span>© 2025 OneTripz. For the curious, near and far.</span><span className="ot-mono">Go somewhere good</span></div></div>
      </footer>
      {toast && <div className="ot-toast" role="status" data-testid="status-toast">{toast}</div>}
    </main>
  );
}

function LanguagePopover({ language, onSelect }: { language: string; onSelect: (language: string) => void }) {
  return <div className="ot-language-popover" role="dialog" aria-label="Choose language" data-testid="popover-language"><strong>Choose your language</strong><div className="ot-language-list">{languages.map((option) => <button className={`ot-language-option ${language === option ? 'selected' : ''}`} key={option} onClick={() => onSelect(option)} data-testid={`language-${option.toLowerCase().replace(/\s/g, '-')}`}>{language === option && <Check size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />}{option}</button>)}</div></div>;
}

function WidgetEmptyState({ category, error }: { category: WidgetCategory; error?: string }) {
  const label = category === 'cars' ? 'car rental' : category === 'bikes' ? 'bike rental' : category.slice(0, -1);
  return (
    <div className="ot-widget-empty">
      <div className="ot-widget-empty-icon"><MapPinned size={18} /></div>
      <div><strong>{error ? 'Live widget service is not connected.' : category === 'flights' ? 'No flight widget is published yet.' : `No ${label} widget is published yet.`}</strong><p>{error || 'Publish a provider widget from the admin panel to show it in this tab.'}</p></div>
      <a href={`${import.meta.env.BASE_URL}admin-setup`}>Open Admin <ArrowRight size={14} /></a>
    </div>
  );
}

function WidgetPlacementSection({ widgets, placement }: { widgets: TravelWidget[]; placement: 'after-destinations' | 'before-faq' | 'footer' }) {
  const activeWidgets = widgets.filter((widget) => widget.active && widget.placement === placement);
  if (!activeWidgets.length) return null;

  const placementCopy = {
    'after-destinations': { kicker: 'More ways to go', title: 'Book the details that make the trip yours.', icon: <MapPinned size={18} /> },
    'before-faq': { kicker: 'Keep planning', title: 'One more useful thing before you go.', icon: <Search size={18} /> },
    footer: { kicker: 'Travel partners', title: 'Bring the next part of your journey closer.', icon: <ArrowRight size={18} /> },
  }[placement];

  return (
    <section className={`ot-widget-section ot-widget-section-${placement}`} aria-label={placementCopy.title}>
      <div className="ot-container">
        <div className="ot-widget-section-heading"><div><p className="ot-section-kicker ot-mono">{placementCopy.kicker}</p><h2 className="ot-display">{placementCopy.title}</h2></div><span className="ot-widget-section-mark">{placementCopy.icon}</span></div>
        <div className="ot-placed-widgets">
          {activeWidgets.map((widget) => <article className="ot-placed-widget" key={widget.id}><div className="ot-placed-widget-label"><span>{widget.provider}</span><strong>{widget.title}</strong></div><WidgetRenderer widget={widget} /></article>)}
        </div>
      </div>
    </section>
  );
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route path="/admin" component={Admin} /><Route path="/admin-setuo" component={Admin} /><Route path="/admin-setup" component={Admin} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></QueryClientProvider>;
}

export default App;
