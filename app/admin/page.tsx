'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase';
import type { Recipe, RecipeImport, Course, Allergen, Profile } from '@/lib/types';

type AdminTab = 'event' | 'database';

const TABLES = ['profiles', 'events', 'cookbooks', 'recipes', 'rsvps', 'claims'] as const;
type TableName = typeof TABLES[number];

const SAMPLE_JSON = `[
  {
    "name": "Roasted Cauliflower with Tahini",
    "page_number": 42,
    "course": "side",
    "allergens": ["nuts"],
    "is_vegetarian": true,
    "is_vegan": true
  }
]`;

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('member');
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const [activeTab, setActiveTab] = useState<AdminTab>('event');

  // Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [volumeNumber, setVolumeNumber] = useState(1);
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [cookbookName, setCookbookName] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [colorTheme, setColorTheme] = useState('');

  // Recipe JSON state
  const [jsonInput, setJsonInput] = useState('');
  const [parsedRecipes, setParsedRecipes] = useState<RecipeImport[]>([]);
  const [parseError, setParseError] = useState('');

  // Existing data
  const [existingEventId, setExistingEventId] = useState<string | null>(null);
  const [existingCookbookId, setExistingCookbookId] = useState<string | null>(null);
  const [existingRecipes, setExistingRecipes] = useState<Recipe[]>([]);

  // DB Editor state
  const [dbTable, setDbTable] = useState<TableName>('profiles');
  const [dbRows, setDbRows] = useState<any[]>([]);
  const [dbColumns, setDbColumns] = useState<string[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbMessage, setDbMessage] = useState('');
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Status
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    const supabase = createBrowserSupabase();

    // Get user role
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setUserRole(profileData?.role || 'admin');
    }

    // Check if there's an active event
    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (eventData) {
      setExistingEventId(eventData.id);
      setEventTitle(eventData.title || '');
      setVolumeNumber(eventData.volume_number);
      setEventDate(eventData.date);
      setEventTime(eventData.event_time || '');
      setEventLocation(eventData.location || '');
      if (eventData.color_theme) setColorTheme(eventData.color_theme);

      const { data: cookbookData } = await supabase
        .from('cookbooks')
        .select('*')
        .eq('event_id', eventData.id)
        .single();

      if (cookbookData) {
        setExistingCookbookId(cookbookData.id);
        setCookbookName(cookbookData.name);
        if (cookbookData.cover_url) setCoverPreview(cookbookData.cover_url);

        const { data: recipesData } = await supabase
          .from('recipes')
          .select('*')
          .eq('cookbook_id', cookbookData.id)
          .order('course')
          .order('name');

        setExistingRecipes(recipesData || []);
      }
    }

    setLoading(false);
  };

  // ─── DB Editor ───

  const loadTable = async (table: TableName) => {
    setDbLoading(true);
    setDbMessage('');
    const supabase = createBrowserSupabase();
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(100);
    if (error) {
      setDbMessage(`Error: ${error.message}`);
      setDbRows([]);
      setDbColumns([]);
    } else {
      setDbRows(data || []);
      if (data && data.length > 0) {
        setDbColumns(Object.keys(data[0]));
      }
    }
    setDbLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'database' && userRole === 'super_admin') {
      loadTable(dbTable);
    }
  }, [dbTable, activeTab, userRole]);

  const handleCellSave = async (rowIdx: number, col: string) => {
    const row = dbRows[rowIdx];
    if (!row?.id) return;

    const supabase = createBrowserSupabase();
    let parsedValue: any = editValue;

    // Try to parse JSON for array/object columns
    if (editValue.startsWith('[') || editValue.startsWith('{')) {
      try { parsedValue = JSON.parse(editValue); } catch { }
    }
    // Parse booleans
    if (editValue === 'true') parsedValue = true;
    if (editValue === 'false') parsedValue = false;
    // Parse null
    if (editValue === 'null' || editValue === '') parsedValue = null;
    // Parse numbers
    if (/^\d+$/.test(editValue)) parsedValue = parseInt(editValue);

    const { error } = await supabase.from(dbTable).update({ [col]: parsedValue }).eq('id', row.id);
    if (error) {
      setDbMessage(`Error: ${error.message}`);
    } else {
      const updated = [...dbRows];
      updated[rowIdx] = { ...updated[rowIdx], [col]: parsedValue };
      setDbRows(updated);
      setDbMessage(`Updated ${col} for row ${row.id.substring(0, 8)}…`);
    }
    setEditingCell(null);
  };

  const handleDeleteRow = async (rowIdx: number) => {
    const row = dbRows[rowIdx];
    if (!row?.id) return;
    if (!confirm(`Delete row ${row.id.substring(0, 8)}…?`)) return;

    const supabase = createBrowserSupabase();
    const { error } = await supabase.from(dbTable).delete().eq('id', row.id);
    if (error) {
      setDbMessage(`Error: ${error.message}`);
    } else {
      setDbRows(prev => prev.filter((_, i) => i !== rowIdx));
      setDbMessage('Row deleted');
    }
  };

  // ─── Event Handlers ───

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setJsonInput(text);
      parseJson(text);
    };
    reader.readAsText(file);
  };

  const parseJson = (text: string) => {
    setParseError('');
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) { setParseError('JSON must be an array of recipes'); return; }
      const validCourses = ['appetizer', 'main', 'side', 'dessert'];
      const validAllergens = ['nuts', 'dairy', 'gluten', 'eggs', 'shellfish', 'soy'];
      for (let i = 0; i < data.length; i++) {
        const r = data[i];
        if (!r.name) { setParseError(`Recipe #${i + 1} missing "name"`); return; }
        if (!validCourses.includes(r.course)) { setParseError(`Recipe "${r.name}" has invalid course "${r.course}"`); return; }
        if (r.allergens && !Array.isArray(r.allergens)) { setParseError(`Recipe "${r.name}" allergens must be an array`); return; }
        if (r.allergens) {
          for (const a of r.allergens) {
            if (!validAllergens.includes(a)) { setParseError(`Recipe "${r.name}" has invalid allergen "${a}"`); return; }
          }
        }
      }
      setParsedRecipes(data);
      setMessage(`Parsed ${data.length} recipes successfully`);
    } catch (err: any) {
      setParseError(`Invalid JSON: ${err.message}`);
      setParsedRecipes([]);
    }
  };

  const handleSaveEvent = async () => {
    if (!eventDate || !cookbookName.trim()) {
      setMessage('Please fill in event date and cookbook name');
      return;
    }

    setSaving(true);
    setMessage('');
    const supabase = createBrowserSupabase();

    try {
      let coverUrl = coverPreview;
      if (coverFile) {
        const filePath = `covers/${Date.now()}-${coverFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('cookbook-covers')
          .upload(filePath, coverFile, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('cookbook-covers')
            .getPublicUrl(filePath);
          coverUrl = publicUrl;
        }
      }

      let eventId = existingEventId;
      if (eventId) {
        await supabase.from('events').update({
          title: eventTitle.trim() || `Vol. ${volumeNumber}`,
          volume_number: volumeNumber,
          date: eventDate,
          event_time: eventTime || null,
          location: eventLocation || null,
          color_theme: colorTheme || null,
          lock_time: new Date(new Date(eventDate).getTime() - 48 * 60 * 60 * 1000).toISOString(),
        }).eq('id', eventId);
      } else {
        const { data: newEvent } = await supabase.from('events').insert({
          title: eventTitle.trim() || `Vol. ${volumeNumber}`,
          volume_number: volumeNumber,
          date: eventDate,
          event_time: eventTime || null,
          location: eventLocation || null,
          color_theme: colorTheme || null,
          is_active: true,
          lock_time: new Date(new Date(eventDate).getTime() - 48 * 60 * 60 * 1000).toISOString(),
        }).select().single();
        eventId = newEvent?.id;
        setExistingEventId(eventId!);
      }

      let cookbookId = existingCookbookId;
      if (cookbookId) {
        await supabase.from('cookbooks').update({
          name: cookbookName.trim(),
          cover_url: coverUrl || null,
        }).eq('id', cookbookId);
      } else {
        const { data: newCookbook } = await supabase.from('cookbooks').insert({
          name: cookbookName.trim(),
          cover_url: coverUrl || null,
          event_id: eventId!,
        }).select().single();
        cookbookId = newCookbook?.id;
        setExistingCookbookId(cookbookId!);
      }

      setMessage('Event saved!');
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    }

    setSaving(false);
  };

  const handlePublishRecipes = async () => {
    if (parsedRecipes.length === 0) { setMessage('No recipes to publish — paste JSON first'); return; }
    if (!existingCookbookId) { setMessage('Save the event first'); return; }

    setSaving(true);
    const supabase = createBrowserSupabase();
    try {
      await supabase.from('recipes').delete().eq('cookbook_id', existingCookbookId);
      const rows = parsedRecipes.map(r => ({
        cookbook_id: existingCookbookId,
        name: r.name,
        page_number: r.page_number || null,
        course: r.course,
        allergens: r.allergens || [],
        is_vegetarian: r.is_vegetarian || false,
        is_vegan: r.is_vegan || false,
      }));
      const { error } = await supabase.from('recipes').insert(rows);
      if (error) throw error;
      setMessage(`Published ${rows.length} recipes!`);
      setExistingRecipes(rows as any);
      setParsedRecipes([]);
      setJsonInput('');
    } catch (err: any) {
      setMessage('Error publishing: ' + err.message);
    }
    setSaving(false);
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    const supabase = createBrowserSupabase();
    await supabase.from('recipes').delete().eq('id', recipeId);
    setExistingRecipes(prev => prev.filter(r => r.id !== recipeId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="font-display italic text-lg" style={{ color: 'var(--accent-warm)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display italic text-3xl" style={{ color: 'var(--ink)' }}>Admin</h1>
          <button onClick={() => router.push('/event')} className="text-sm font-body underline" style={{ color: 'var(--accent-warm)' }}>
            ← Back to event
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid rgba(212,184,150,0.3)' }}>
          <button
            onClick={() => setActiveTab('event')}
            className="px-4 py-2 text-sm font-body transition-all"
            style={{
              color: activeTab === 'event' ? 'var(--accent)' : 'var(--accent-warm)',
              borderBottom: activeTab === 'event' ? '2px solid var(--accent)' : '2px solid transparent',
              fontWeight: activeTab === 'event' ? 500 : 400,
            }}
          >
            Event Setup
          </button>
          {userRole === 'super_admin' && (
            <button
              onClick={() => setActiveTab('database')}
              className="px-4 py-2 text-sm font-body transition-all"
              style={{
                color: activeTab === 'database' ? 'var(--accent)' : 'var(--accent-warm)',
                borderBottom: activeTab === 'database' ? '2px solid var(--accent)' : '2px solid transparent',
                fontWeight: activeTab === 'database' ? 500 : 400,
              }}
            >
              🗄️ Database
            </button>
          )}
        </div>

        {!isAdmin && (
          <div className="mb-6 py-3 px-4 rounded text-sm font-body" style={{
            background: 'rgba(212,184,150,0.15)',
            color: 'var(--accent-warm)',
          }}>
            🔒 View only — you need admin access to edit event details.
          </div>
        )}

        {message && (
          <div className="mb-4 py-2 px-4 rounded text-sm font-body" style={{
            background: message.includes('Error') ? 'rgba(196,71,58,0.1)' : 'rgba(212,184,150,0.2)',
            color: message.includes('Error') ? 'var(--accent)' : 'var(--ink)',
          }}>
            {message}
          </div>
        )}

        {/* ═══════ EVENT SETUP TAB ═══════ */}
        {activeTab === 'event' && (
          <div style={{ opacity: isAdmin ? 1 : 0.5, pointerEvents: isAdmin ? 'auto' : 'none' }}>
            {/* Section 1: Event Details */}
            <section className="mb-10">
              <h2 className="font-display italic text-xl mb-4" style={{ color: 'var(--ink)' }}>Event Details</h2>
              <div className="space-y-4" style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '8px' }}>

                <div>
                  <label className="block text-xs font-body uppercase tracking-widest mb-1" style={{ color: 'var(--accent-warm)' }}>Event Title</label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="input-elegant font-body"
                    placeholder="e.g. March Supper Club"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-body uppercase tracking-widest mb-1" style={{ color: 'var(--accent-warm)' }}>Volume #</label>
                    <input type="number" value={volumeNumber} onChange={(e) => setVolumeNumber(parseInt(e.target.value) || 1)} className="input-elegant font-body" min={1} />
                  </div>
                  <div>
                    <label className="block text-xs font-body uppercase tracking-widest mb-1" style={{ color: 'var(--accent-warm)' }}>Event Date</label>
                    <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="input-elegant font-body" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-body uppercase tracking-widest mb-1" style={{ color: 'var(--accent-warm)' }}>Time</label>
                    <input
                      type="text"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="input-elegant font-body"
                      placeholder="e.g. 7:00 PM"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-body uppercase tracking-widest mb-1" style={{ color: 'var(--accent-warm)' }}>Location</label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      className="input-elegant font-body"
                      placeholder="e.g. Priya's Place"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-body uppercase tracking-widest mb-1" style={{ color: 'var(--accent-warm)' }}>Cookbook Name</label>
                  <input type="text" value={cookbookName} onChange={(e) => setCookbookName(e.target.value)} className="input-elegant font-body" placeholder="e.g. The Chutney Life" />
                </div>

                <div>
                  <label className="block text-xs font-body uppercase tracking-widest mb-1" style={{ color: 'var(--accent-warm)' }}>Cover Image</label>
                  <div className="flex items-center gap-4">
                    <input type="file" accept="image/*" onChange={handleCoverChange} className="text-sm font-body" />
                    {coverPreview && <img src={coverPreview} alt="Cover" className="w-16 h-20 object-cover rounded" />}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-body uppercase tracking-widest mb-1" style={{ color: 'var(--accent-warm)' }}>Color Theme Override (optional JSON)</label>
                  <input type="text" value={colorTheme} onChange={(e) => setColorTheme(e.target.value)} className="input-elegant font-body text-xs font-mono" placeholder='{"accent": "#2E6B4E"}' />
                </div>

                <button onClick={handleSaveEvent} disabled={saving} className="btn-elegant-filled py-2 px-6 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </section>

            {/* Section 2: Recipe JSON */}
            <section className="mb-10">
              <h2 className="font-display italic text-xl mb-4" style={{ color: 'var(--ink)' }}>Recipe Data</h2>
              <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '8px' }}>
                <p className="text-xs font-body mb-3" style={{ color: 'var(--accent-warm)' }}>Paste a JSON array of recipes, or upload a .json file.</p>
                <div className="mb-4">
                  <input type="file" accept=".json" onChange={handleJsonFile} className="text-sm font-body" />
                </div>
                <textarea
                  value={jsonInput}
                  onChange={(e) => { setJsonInput(e.target.value); if (e.target.value.trim()) parseJson(e.target.value); }}
                  rows={8}
                  className="w-full font-mono text-xs p-3 rounded"
                  style={{ background: 'var(--bg)', border: '1px solid var(--accent-warm)', color: 'var(--ink)', resize: 'vertical' }}
                  placeholder={SAMPLE_JSON}
                />
                {parseError && <p className="text-xs font-body mt-2" style={{ color: 'var(--accent)' }}>❌ {parseError}</p>}
                {parsedRecipes.length > 0 && <p className="text-xs font-body mt-2" style={{ color: 'var(--ink)' }}>✅ {parsedRecipes.length} recipes parsed</p>}

                <div className="mt-4 flex gap-3">
                  <button onClick={handlePublishRecipes} disabled={saving || parsedRecipes.length === 0} className="btn-elegant-filled py-2 px-6 disabled:opacity-50">
                    {saving ? 'Publishing...' : `Publish ${parsedRecipes.length} Recipes`}
                  </button>
                  <button onClick={() => { setJsonInput(SAMPLE_JSON); parseJson(SAMPLE_JSON); }} className="text-xs font-body underline" style={{ color: 'var(--accent-warm)' }}>
                    Load sample
                  </button>
                </div>
              </div>
            </section>

            {/* Section 3: Existing Recipes */}
            {existingRecipes.length > 0 && (
              <section>
                <h2 className="font-display italic text-xl mb-4" style={{ color: 'var(--ink)' }}>
                  Published Recipes ({existingRecipes.length})
                </h2>
                <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '8px' }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-body">
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--accent-warm)' }}>
                          <th className="text-left py-2 pr-3">Name</th>
                          <th className="text-left py-2 pr-3">Page</th>
                          <th className="text-left py-2 pr-3">Course</th>
                          <th className="text-left py-2 pr-3">Veg?</th>
                          <th className="text-left py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {existingRecipes.map(r => (
                          <tr key={r.id} style={{ borderBottom: '1px solid rgba(212,184,150,0.2)' }}>
                            <td className="py-1.5 pr-3">{r.name}</td>
                            <td className="py-1.5 pr-3">{r.page_number || '—'}</td>
                            <td className="py-1.5 pr-3">{r.course}</td>
                            <td className="py-1.5 pr-3">{r.is_vegetarian ? '🌱' : '🍖'}</td>
                            <td className="py-1.5">
                              <button onClick={() => handleDeleteRecipe(r.id)} className="text-xs underline" style={{ color: 'var(--accent)' }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ═══════ DATABASE TAB (Super Admin Only) ═══════ */}
        {activeTab === 'database' && userRole === 'super_admin' && (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <select
                value={dbTable}
                onChange={(e) => setDbTable(e.target.value as TableName)}
                className="recipe-select font-body text-sm"
              >
                {TABLES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                onClick={() => loadTable(dbTable)}
                className="text-xs font-body underline"
                style={{ color: 'var(--accent)' }}
              >
                Refresh
              </button>
              <span className="text-xs font-body" style={{ color: 'var(--accent-warm)' }}>
                {dbRows.length} rows
              </span>
            </div>

            {dbMessage && (
              <div className="mb-3 py-2 px-3 rounded text-xs font-body" style={{
                background: dbMessage.includes('Error') ? 'rgba(196,71,58,0.1)' : 'rgba(212,184,150,0.15)',
                color: dbMessage.includes('Error') ? 'var(--accent)' : 'var(--ink)',
              }}>
                {dbMessage}
              </div>
            )}

            {dbLoading ? (
              <p className="font-display italic text-sm" style={{ color: 'var(--accent-warm)' }}>Loading table...</p>
            ) : (
              <div style={{ background: 'var(--surface)', borderRadius: '8px', overflow: 'hidden' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-body">
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--accent-warm)' }}>
                        {dbColumns.map(col => (
                          <th key={col} className="text-left py-2 px-2 whitespace-nowrap font-medium" style={{ color: 'var(--accent-warm)' }}>
                            {col}
                          </th>
                        ))}
                        <th className="text-left py-2 px-2" style={{ color: 'var(--accent-warm)' }}>⚙</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbRows.map((row, rowIdx) => (
                        <tr key={row.id || rowIdx} style={{ borderBottom: '1px solid rgba(212,184,150,0.15)' }} className="hover:bg-[rgba(212,184,150,0.05)]">
                          {dbColumns.map(col => {
                            const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.col === col;
                            const value = row[col];
                            const displayValue = value === null ? 'null' : typeof value === 'object' ? JSON.stringify(value) : String(value);
                            const isId = col === 'id';

                            return (
                              <td key={col} className="py-1.5 px-2 max-w-[200px]">
                                {isEditing ? (
                                  <div className="flex gap-1">
                                    <input
                                      type="text"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCellSave(rowIdx, col);
                                        if (e.key === 'Escape') setEditingCell(null);
                                      }}
                                      className="w-full text-xs p-1 rounded"
                                      style={{ border: '1px solid var(--accent)', background: 'var(--bg)' }}
                                      autoFocus
                                    />
                                    <button onClick={() => handleCellSave(rowIdx, col)} className="text-xs" style={{ color: 'var(--accent)' }}>✓</button>
                                  </div>
                                ) : (
                                  <span
                                    className={`truncate block ${isId ? '' : 'cursor-pointer hover:underline'}`}
                                    style={{ color: isId ? 'var(--accent-warm)' : 'var(--ink)', fontSize: isId ? '9px' : '11px' }}
                                    onClick={() => {
                                      if (!isId) {
                                        setEditingCell({ rowIdx, col });
                                        setEditValue(displayValue === 'null' ? '' : displayValue);
                                      }
                                    }}
                                    title={displayValue}
                                  >
                                    {displayValue.length > 30 ? displayValue.substring(0, 30) + '…' : displayValue}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-1.5 px-2">
                            <button
                              onClick={() => handleDeleteRow(rowIdx)}
                              className="text-xs"
                              style={{ color: 'var(--accent)' }}
                              title="Delete row"
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {dbRows.length === 0 && (
                  <p className="text-center py-6 text-xs font-body italic" style={{ color: 'var(--accent-warm)' }}>
                    No rows in this table
                  </p>
                )}
              </div>
            )}

            <p className="mt-3 text-xs font-body italic" style={{ color: 'var(--accent-warm)' }}>
              ⚠️ Click any cell to edit. Changes are saved immediately to the database.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
