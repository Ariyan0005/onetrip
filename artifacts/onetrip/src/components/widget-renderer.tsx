import { useEffect } from 'react';
import { buildWidgetDocument, isDefaultTravelpayoutsFlight, type TravelWidget } from '@/lib/widget-store';

declare global {
  interface Window {
    TPWL_CONFIGURATION?: Record<string, unknown>;
  }
}

export function WidgetRenderer({ widget, preview = false }: { widget: TravelWidget; preview?: boolean }) {
  if (isDefaultTravelpayoutsFlight(widget)) {
    return <TravelpayoutsFlightWidget />;
  }

  return (
    <iframe
      className={`ot-widget-frame${preview ? ' ot-widget-frame-preview' : ''}`}
      title={widget.title}
      srcDoc={buildWidgetDocument(widget)}
      sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      loading={preview ? 'lazy' : 'eager'}
    />
  );
}

function TravelpayoutsFlightWidget() {
  useEffect(() => {
    window.TPWL_CONFIGURATION = {
      ...window.TPWL_CONFIGURATION,
      resultsURL: 'https://book.onetripz.com',
    };

    const existing = document.querySelector<HTMLScriptElement>('script[data-onetrip-travelpayouts]');
    if (!existing) {
      const script = document.createElement('script');
      script.type = 'module';
      script.async = true;
      script.src = 'https://tpscr.com/wl_web/main.js?wl_id=21725';
      script.dataset.onetripTravelpayouts = 'true';
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="ot-tpwl-widget-host">
      <div id="tpwl-search" aria-label="Flight search form" />
      <div id="tpwl-tickets" aria-label="Flight search results" />
    </div>
  );
}