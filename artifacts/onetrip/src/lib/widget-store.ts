export type WidgetCategory = 'flights' | 'hotels' | 'cars' | 'bikes' | 'tours' | 'transfers' | 'other';
export type WidgetPlacement = 'hero' | 'after-destinations' | 'before-faq' | 'footer';

export interface TravelWidget {
  id: string;
  title: string;
  provider: string;
  category: WidgetCategory;
  placement: WidgetPlacement;
  code: string;
  scriptUrl: string;
  active: boolean;
  updatedAt: string;
}

export const widgetCategories: Array<{ value: WidgetCategory; label: string }> = [
  { value: 'flights', label: 'Flights' },
  { value: 'hotels', label: 'Hotels' },
  { value: 'cars', label: 'Cars' },
  { value: 'bikes', label: 'Bikes' },
  { value: 'tours', label: 'Tours' },
  { value: 'transfers', label: 'Transfers' },
  { value: 'other', label: 'Other' },
];

export const widgetPlacements: Array<{ value: WidgetPlacement; label: string; description: string }> = [
  { value: 'hero', label: 'Homepage booking box', description: 'Top booking card with the Flight / Hotel / Car tabs.' },
  { value: 'after-destinations', label: 'After destinations', description: 'A dedicated booking section directly below the destination cards.' },
  { value: 'before-faq', label: 'Before FAQ', description: 'A booking section before the frequently asked questions.' },
  { value: 'footer', label: 'Above the footer', description: 'A compact widget area near the end of the homepage.' },
];

export function buildWidgetDocument(widget: TravelWidget) {
  const script = widget.scriptUrl.trim()
    ? `<script async src="${escapeAttribute(widget.scriptUrl.trim())}"></script>`
    : '';

  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; min-height: 100%; background: transparent; }
      body { padding: 12px; box-sizing: border-box; font-family: Arial, sans-serif; }
      *, *::before, *::after { box-sizing: border-box; }
    </style>
  </head>
  <body>${widget.code}${script}</body>
</html>`;
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function isDefaultTravelpayoutsFlight(widget: TravelWidget) {
  return widget.id === 'travelpayouts-flight-default';
}