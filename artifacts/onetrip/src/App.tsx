import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Check, ChevronDown, Globe2, Menu, Search, ShieldCheck, Sparkles, Users, X } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
const logo = `${import.meta.env.BASE_URL}onetrip-logo.png`;
const travelpayoutsWidgetScript = 'https://tpscr.com/wl_web/main.js?wl_id=21725';
const languages = ['English', 'Español', 'Français', 'Deutsch', 'Italiano', 'Português', 'Nederlands', 'Türkçe', 'Ελληνικά', '中文', '日本語', '한국어', 'العربية', 'हिन्दी', 'ภาษาไทย', 'Bahasa Indonesia', 'Polski', 'Svenska', 'Dansk', 'Norsk', 'Suomi', 'Čeština', 'Magyar', 'עברית', 'Tiếng Việt', 'Українська'];
const destinations = [
  { name: 'Lisbon', country: 'Portugal', className: 'ot-destination-main' },
  { name: 'Kyoto', country: 'Japan', className: 'small' },
  { name: 'Marrakech', country: 'Morocco', className: 'small' },
  { name: 'Reykjavík', country: 'Iceland', className: 'small' },
  { name: 'Mexico City', country: 'Mexico', className: 'small' },
];

const faqs = [
  {
    q: 'How does OneTripz find cheap flight tickets?',
    a: 'OneTripz scans and compares live airfares from over 500 airlines, low-cost carriers, and certified ticket providers in real time, delivering the best available flight rates without having to check multiple websites.',
  },
  {
    q: 'Does OneTripz charge any booking fees?',
    a: 'No. OneTripz is 100% free for travelers. There are zero hidden fees, extra surcharges, or markups. You always proceed and complete your booking directly on the airline or verified agency partner site.',
  },
  {
    q: 'Can I search for both international and domestic flights?',
    a: 'Yes, our global search engine supports international routes worldwide as well as domestic flights across North America, Europe, Asia, the Middle East, and Australasia.',
  },
  {
    q: 'What is the best way to get discount airfares?',
    a: 'Book 3–8 weeks prior to departure, stay flexible with midweek travel dates (Tuesdays and Wednesdays often have lower fares), and compare different departure times using our real-time filter panel.',
  },
];

declare global {
  interface Window {
    TPWL_CONFIGURATION?: Record<string, unknown>;
  }
}

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [language, setLanguage] = useState('English');
  const [toast, setToast] = useState('');

  useEffect(() => {
    window.TPWL_CONFIGURATION = {
      ...window.TPWL_CONFIGURATION,
      resultsURL: 'https://book.onetripz.com',
    };

    const scriptSrc = 'https://tpscr.com/wl_web/main.js?wl_id=21725';
    const existing = document.querySelector<HTMLScriptElement>(`script[src*="wl_web/main.js"]`);
    if (!existing) {
      const script = document.createElement('script');
      script.type = 'module';
      script.async = true;
      script.src = scriptSrc;
      document.head.appendChild(script);
    }

    const favicon = document.querySelector<HTMLLinkElement>('link[data-onetrip-favicon]') || document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    favicon.href = logo;
    favicon.dataset.onetripFavicon = 'true';
    if (!favicon.parentNode) document.head.appendChild(favicon);
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
        <div className="ot-container ot-hero-grid">
          <div>
            <p className="ot-eyebrow ot-mono">The clear way to go further</p>
            <h1 className="ot-display">Your next trip, <em>sorted.</em></h1>
            <p className="ot-hero-copy">Compare flights, stays, tours, and transfers in one calm place. OneTripz turns the big, messy question of “where next?” into a plan you can feel good about.</p>
            <div className="ot-hero-actions">
              <a className="ot-primary-btn" href="#search" data-testid="link-hero-search">Find my way <ArrowRight size={17} /></a>
              <a className="ot-ghost-btn" href="#destinations" data-testid="link-hero-explore">Explore destinations</a>
            </div>
            <div className="ot-hero-note"><ShieldCheck size={16} /><span>Independent comparisons. Clear prices. No planning fog.</span></div>
          </div>
          <div className="ot-trip-visual" aria-label="Illustration of a route connecting Lisbon and Tokyo">
            <div className="ot-orbit" />
            <div className="ot-sky-card"><div className="ot-route" /><span className="ot-route-label ot-mono">START HERE</span><span className="ot-city"><strong>Lisbon</strong>38°43′N · 9°08′W</span></div>
            <div className="ot-floating-stamp"><div><strong>01</strong>one good<br />place to begin</div></div>
          </div>
        </div>
      </section>

      <section className="ot-container ot-search-wrap" id="search" aria-label="Trip search">
        <div className="ot-search-panel ot-travelpayouts-panel" data-testid="panel-travelpayouts-widget">
          <div className="ot-widget-intro">
            <div>
              <p className="ot-section-kicker ot-mono">Search with OneTripz</p>
              <h2 className="ot-widget-title">Find the route that feels right.</h2>
            </div>
            <p>Compare live flight options and continue to a trusted booking partner when you are ready.</p>
          </div>
          <div className="ot-tpwl-widget-host" data-testid="container-tpwl-host">
            <div id="tpwl-search" aria-label="Flight search form" />
            <div id="tpwl-tickets" aria-label="Flight search results" />
          </div>
        </div>
      </section>

      <section className="ot-section ot-container" id="destinations">
        <div className="ot-section-top"><div><p className="ot-section-kicker ot-mono">A little further</p><h2 className="ot-display">Places with a pull.</h2></div><p className="ot-section-intro">Start with a feeling, not a spreadsheet. These are the places our editors keep returning to — for very good reasons.</p></div>
        <div className="ot-destination-grid">
          {destinations.map((destination, index) => <button className={`ot-destination ${destination.className}`} key={destination.name} onClick={() => chooseDestination(destination.name)} data-testid={`card-destination-${index}`}><div className="ot-destination-content"><div><h3>{destination.name}</h3><p>{destination.country}</p></div><span className="ot-destination-arrow"><ArrowRight size={15} /></span></div></button>)}
        </div>
      </section>

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
              <h3>{faq.q}</h3>
              <p>{faq.a}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ot-cta">
        <div className="ot-container ot-cta-inner"><h2 className="ot-display">There is a whole world past the open tabs.</h2><div><p>Close the research spiral. Start with one destination and let the rest unfold.</p><a className="ot-primary-btn" href="#search" data-testid="link-cta-search">Start with a search <ArrowRight size={16} /></a></div></div>
      </section>

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

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></QueryClientProvider>;
}

export default App;
