import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, Check, Code2, FileUp, Pencil, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import {
  widgetCategories,
  widgetPlacements,
  type TravelWidget,
  type WidgetCategory,
  type WidgetPlacement,
} from '@/lib/widget-store';
import {
  createWidget,
  deleteWidget,
  getAdminSession,
  getAdminWidgets,
  loginAdmin,
  logoutAdmin,
  updateWidget,
  WidgetApiError,
  type WidgetInput,
} from '@/lib/widget-api';
import { WidgetRenderer } from '@/components/widget-renderer';

const blankWidget = (): TravelWidget => ({
  id: '',
  title: '',
  provider: '',
  category: 'hotels',
  placement: 'hero',
  code: '<div id="your-widget"></div>',
  scriptUrl: '',
  active: true,
  updatedAt: new Date().toISOString(),
});

export default function Admin() {
  const [widgets, setWidgets] = useState<TravelWidget[]>([]);
  const [form, setForm] = useState<TravelWidget>(blankWidget);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const isEditing = Boolean(form.id);

  useEffect(() => {
    void getAdminSession()
      .then(async (session) => {
        setConfigured(session.configured);
        setAuthenticated(session.authenticated);
        if (session.authenticated) setWidgets(await getAdminWidgets());
      })
      .catch((requestError: unknown) => {
        setError(requestError instanceof WidgetApiError ? requestError.message : 'Admin service is unavailable.');
      })
      .finally(() => setLoading(false));
  }, []);

  const sortedWidgets = useMemo(
    () => [...widgets].sort((a, b) => Number(b.active) - Number(a.active) || a.title.localeCompare(b.title)),
    [widgets],
  );

  const updateForm = <K extends keyof TravelWidget>(key: K, value: TravelWidget[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      await loginAdmin(password);
      setAuthenticated(true);
      setPassword('');
      setWidgets(await getAdminWidgets());
      setNotice('Admin session started.');
    } catch (requestError: unknown) {
      setError(requestError instanceof WidgetApiError ? requestError.message : 'Admin login failed.');
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.provider.trim() || !form.code.trim()) {
      setNotice('Title, provider, and widget code are required.');
      return;
    }

    setError('');
    const payload: WidgetInput = {
      title: form.title.trim(),
      provider: form.provider.trim(),
      category: form.category,
      placement: form.placement,
      code: form.code,
      scriptUrl: form.scriptUrl.trim(),
      active: form.active,
    };
    try {
      if (isEditing) await updateWidget(form.id, payload);
      else await createWidget(payload);
      setWidgets(await getAdminWidgets());
      setForm(blankWidget());
      setNotice(isEditing ? 'Widget updated and published.' : 'Widget added and published.');
    } catch (requestError: unknown) {
      setError(requestError instanceof WidgetApiError ? requestError.message : 'Widget could not be saved.');
    }
  };

  const editWidget = (widget: TravelWidget) => {
    setForm(widget);
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this widget from the homepage?')) return;
    try {
      await deleteWidget(id);
      setWidgets(await getAdminWidgets());
      setNotice('Widget removed.');
    } catch (requestError: unknown) {
      setError(requestError instanceof WidgetApiError ? requestError.message : 'Widget could not be deleted.');
    }
  };

  const toggleWidget = async (widget: TravelWidget) => {
    try {
      await updateWidget(widget.id, { active: !widget.active });
      setWidgets(await getAdminWidgets());
    } catch (requestError: unknown) {
      setError(requestError instanceof WidgetApiError ? requestError.message : 'Widget status could not be changed.');
    }
  };

  const handleCodeFile = async (file?: File) => {
    if (!file) return;
    const code = await file.text();
    updateForm('code', code);
    setNotice(`${file.name} loaded. Review the code, then publish it.`);
  };

  const handleRefresh = async () => {
    try {
      setWidgets(await getAdminWidgets());
      setNotice('Widget library refreshed.');
    } catch (requestError: unknown) {
      setError(requestError instanceof WidgetApiError ? requestError.message : 'Widget library could not be refreshed.');
    }
  };

  if (loading) return <main className="ot-admin-page"><div className="ot-container ot-admin-loading">Loading secure widget studio…</div></main>;

  if (!authenticated) {
    return (
      <main className="ot-admin-page">
        <header className="ot-admin-header"><div className="ot-container ot-admin-header-inner"><a className="ot-admin-back" href={import.meta.env.BASE_URL}><ArrowLeft size={16} /> Back to OneTripz</a><span className="ot-admin-badge"><Code2 size={14} /> Widget Studio</span></div></header>
        <div className="ot-container ot-admin-login">
          <section className="ot-admin-card">
            <span className="ot-admin-eyebrow">Protected control room</span>
            <h1 className="ot-display">Sign in to publish widgets.</h1>
            <p>Widget code and placements are stored in the connected Supabase project. Only the admin session can change them.</p>
            {!configured && <div className="ot-admin-error">Set ADMIN_PANEL_PASSWORD and SESSION_SECRET on the VPS before signing in.</div>}
            <form className="ot-admin-form" onSubmit={handleLogin}>
               <input type="text" name="username" autoComplete="username" tabIndex={-1} aria-hidden="true" className="ot-visually-hidden" />
              <label>Admin password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter admin password" /></label>
              <button className="ot-admin-primary" type="submit"><Code2 size={16} /> Sign in</button>
              {error && <p className="ot-admin-error" role="alert">{error}</p>}
            </form>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="ot-admin-page">
      <header className="ot-admin-header">
        <div className="ot-container ot-admin-header-inner">
          <a className="ot-admin-back" href={import.meta.env.BASE_URL}>
            <ArrowLeft size={16} /> Back to OneTripz
          </a>
          <div className="ot-admin-header-actions"><span className="ot-admin-badge"><Code2 size={14} /> Widget Studio</span><button className="ot-admin-logout" type="button" onClick={async () => { await logoutAdmin(); setAuthenticated(false); }}>Log out</button></div>
        </div>
      </header>

      <div className="ot-container ot-admin-layout">
        <section className="ot-admin-intro">
          <p className="ot-section-kicker ot-mono">OneTripz control room</p>
          <h1 className="ot-display">Add a travel widget once. Place it everywhere you need.</h1>
          <p>Paste a provider’s embed code, choose its category and placement, then publish. New widgets run in an isolated preview frame instead of touching the main page.</p>
          <div className="ot-admin-steps">
            <span><b>01</b> Paste provider code</span>
            <span><b>02</b> Choose where it appears</span>
            <span><b>03</b> Publish to the homepage</span>
          </div>
        </section>

        <div className="ot-admin-grid">
          <section className="ot-admin-card">
            <div className="ot-admin-card-heading">
              <div><span className="ot-admin-eyebrow">{isEditing ? 'Edit widget' : 'New widget'}</span><h2>{isEditing ? 'Update this booking block' : 'Add a booking block'}</h2></div>
              {isEditing && <button className="ot-icon-button" type="button" onClick={() => setForm(blankWidget())} aria-label="Cancel editing"><X size={17} /></button>}
            </div>
            <form className="ot-admin-form" onSubmit={handleSave}>
              <label>Widget name<input value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="Example: City tours" /></label>
              <div className="ot-form-row">
                <label>Provider<input value={form.provider} onChange={(event) => updateForm('provider', event.target.value)} placeholder="Travelpayouts, GetYourGuide..." /></label>
                <label>Category<select value={form.category} onChange={(event) => updateForm('category', event.target.value as WidgetCategory)}>{widgetCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label>
              </div>
              <label>Show this widget<select value={form.placement} onChange={(event) => updateForm('placement', event.target.value as WidgetPlacement)}>{widgetPlacements.map((placement) => <option key={placement.value} value={placement.value}>{placement.label}</option>)}</select></label>
              <p className="ot-field-help">{widgetPlacements.find((placement) => placement.value === form.placement)?.description}</p>
              <label>Provider script URL <span className="ot-optional">optional</span><input value={form.scriptUrl} onChange={(event) => updateForm('scriptUrl', event.target.value)} placeholder="https://example.com/widget.js" type="url" /></label>
              <label>Embed HTML / widget code<div className="ot-code-label"><span>Runs in an isolated frame</span><label className="ot-upload-button"><FileUp size={14} /> Upload .html<input type="file" accept=".html,.htm,.txt" onChange={(event) => void handleCodeFile(event.target.files?.[0])} /></label></div><textarea className="ot-code-input" value={form.code} onChange={(event) => updateForm('code', event.target.value)} rows={10} spellCheck={false} placeholder="<div id=&quot;widget-container&quot;></div>" /></label>
              <label className="ot-toggle-row"><span><strong>Published</strong><small>Make this widget visible on the public homepage</small></span><input type="checkbox" checked={form.active} onChange={(event) => updateForm('active', event.target.checked)} /></label>
              <button className="ot-admin-primary" type="submit"><Save size={16} /> {isEditing ? 'Update & publish' : 'Add & publish widget'}</button>
              {notice && <p className="ot-admin-notice" role="status"><Check size={15} /> {notice}</p>}
              {error && <p className="ot-admin-error" role="alert">{error}</p>}
            </form>
          </section>

          <section className="ot-admin-card ot-admin-preview-card">
            <div className="ot-admin-card-heading"><div><span className="ot-admin-eyebrow">Live preview</span><h2>{form.title || 'Your widget preview'}</h2></div><span className="ot-preview-dot">Preview</span></div>
            <div className="ot-admin-preview">
              <WidgetRenderer widget={form.id ? form : { ...form, id: 'preview-widget' }} preview />
            </div>
            <p className="ot-preview-note">Preview is sandboxed. Provider widgets may need their live domain or approved referrer before they display real results.</p>
          </section>
        </div>

        <section className="ot-admin-card ot-widget-list-card">
          <div className="ot-admin-card-heading"><div><span className="ot-admin-eyebrow">Published library</span><h2>Homepage widgets</h2></div><button className="ot-reset-button" type="button" onClick={() => void handleRefresh()}><RefreshCw size={14} /> Refresh</button></div>
          <div className="ot-widget-list">
            {sortedWidgets.map((widget) => (
              <article className={`ot-widget-list-item${widget.active ? '' : ' is-muted'}`} key={widget.id}>
                <div className="ot-widget-list-icon"><Code2 size={18} /></div>
                <div className="ot-widget-list-main"><div className="ot-widget-list-title"><h3>{widget.title}</h3><span>{widget.active ? 'Live' : 'Off'}</span></div><p>{widget.provider} · {widgetCategories.find((category) => category.value === widget.category)?.label} · {widgetPlacements.find((placement) => placement.value === widget.placement)?.label}</p></div>
                <div className="ot-widget-list-actions"><button type="button" onClick={() => void toggleWidget(widget)}>{widget.active ? 'Turn off' : 'Turn on'}</button><button type="button" onClick={() => editWidget(widget)}><Pencil size={14} /> Edit</button><button type="button" className="danger" onClick={() => void handleDelete(widget.id)} aria-label={`Delete ${widget.title}`}><Trash2 size={14} /></button></div>
              </article>
            ))}
          </div>
          {sortedWidgets.length === 0 && <div className="ot-admin-empty"><Plus size={20} /> Add your first provider widget above.</div>}
        </section>
      </div>
    </main>
  );
}