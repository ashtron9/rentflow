import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const REMINDER_TYPES = [
  '🏛️  Property Tax',
  '💧  Water Tax',
  '⚡  Electricity Bill',
  '📄  Rent Agreement Expiry',
  '🔥  Fire Safety Certificate',
  '🏗️  Maintenance Due',
  '🛡️  Property Insurance',
  '🏢  Society / Maintenance Charges',
  '🌐  Broadband / Internet',
  '🧾  Other',
]

export default function Reminders() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ property_name: '', reminder_type: REMINDER_TYPES[0], reminder_date: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => { loadReminders() }, [])

  async function loadReminders() {
    const { data } = await supabase.from('reminders').select('*').order('reminder_date')
    setReminders(data || [])
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.property_name || !form.reminder_date) { setMsg({ type: 'error', text: 'Property and date are required.' }); return }
    setSaving(true)
    setMsg(null)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('reminders').insert({ user_id: user.id, ...form })
    if (error) setMsg({ type: 'error', text: error.message })
    else {
      setMsg({ type: 'success', text: 'Reminder added!' })
      setForm({ property_name: '', reminder_type: REMINDER_TYPES[0], reminder_date: '', note: '' })
      loadReminders()
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    await supabase.from('reminders').delete().eq('id', id)
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>

  const today = new Date()
  today.setHours(0,0,0,0)

  function daysLeft(dateStr) {
    return Math.round((new Date(dateStr) - today) / 86400000)
  }

  const overdue = reminders.filter(r => daysLeft(r.reminder_date) < 0)
  const soon    = reminders.filter(r => { const d = daysLeft(r.reminder_date); return d >= 0 && d <= 30 })
  const upcoming = reminders.filter(r => daysLeft(r.reminder_date) > 30)

  function ReminderCard({ r }) {
    const dl = daysLeft(r.reminder_date)
    const cls = dl < 0 ? 'rem-overdue' : dl <= 30 ? 'rem-soon' : 'rem-ok'
    const badge = dl < 0
      ? <span className="badge badge-red">Overdue {Math.abs(dl)}d</span>
      : dl === 0 ? <span className="badge badge-red">Today!</span>
      : dl <= 30 ? <span className="badge badge-yellow">In {dl}d</span>
      : <span className="badge badge-green">In {dl}d</span>

    return (
      <div className={`rem-card ${cls}`}>
        <div style={{ flex: 1 }}>
          <div className="rem-type">{r.reminder_type}</div>
          <div className="rem-prop">{r.property_name}</div>
          {r.note && <div className="rem-note">📝 {r.note}</div>}
        </div>
        <div className="rem-right">
          <span className="rem-date">📅 {r.reminder_date}</span>
          {badge}
          <button
            className="icon-btn del"
            onClick={() => handleDelete(r.id)}
            title="Delete"
            style={{ width: 26, height: 26 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🔔 Reminders</div>
        <div className="page-sub">Track taxes, agreements, and important property dates</div>
      </div>

      {reminders.length === 0 ? (
        <div className="empty-state" style={{ marginBottom: 28 }}>
          <div className="empty-icon">🔕</div>
          <div className="empty-title">No reminders yet</div>
          <div className="empty-sub">Add your first reminder below.</div>
        </div>
      ) : (
        <>
          {overdue.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="group-header gh-red">🚨 Overdue</div>
              {overdue.map(r => <ReminderCard key={r.id} r={r} />)}
            </div>
          )}
          {soon.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="group-header gh-yellow">⚠️ Due Soon (within 30 days)</div>
              {soon.map(r => <ReminderCard key={r.id} r={r} />)}
            </div>
          )}
          {upcoming.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="group-header gh-green">✅ Upcoming</div>
              {upcoming.map(r => <ReminderCard key={r.id} r={r} />)}
            </div>
          )}
        </>
      )}

      <div className="gold-divider" />
      <div className="section-title">➕ Add New Reminder</div>

      <div className="card">
        {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>}
        <form onSubmit={handleAdd}>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Property / Unit Name</label>
              <input
                type="text" className="form-input" placeholder="e.g. Shop 4, MG Road"
                value={form.property_name} onChange={e => setForm(f => ({ ...f, property_name: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Reminder Type</label>
              <select className="form-input" value={form.reminder_type}
                onChange={e => setForm(f => ({ ...f, reminder_type: e.target.value }))}>
                {REMINDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date" className="form-input"
                value={form.reminder_date} onChange={e => setForm(f => ({ ...f, reminder_date: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Note (optional)</label>
              <input
                type="text" className="form-input" placeholder="e.g. Pay at Municipal Corp. office"
                value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-gold" disabled={saving} style={{ minWidth: 180 }}>
            {saving ? 'Saving…' : 'Add Reminder →'}
          </button>
        </form>
      </div>
    </div>
  )
}
