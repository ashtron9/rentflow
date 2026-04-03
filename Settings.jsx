import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', expected_rent: 10000, property_name: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [editForms, setEditForms] = useState({})

  useEffect(() => { loadTenants() }, [])

  async function loadTenants() {
    const { data } = await supabase.from('tenants').select('*').order('name')
    setTenants(data || [])
    // Init edit forms
    const forms = {}
    data?.forEach(t => { forms[t.id] = { name: t.name, expected_rent: t.expected_rent, property_name: t.property_name || '' } })
    setEditForms(forms)
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name) { setMsg({ type: 'error', text: 'Tenant name is required.' }); return }
    setSaving(true)
    setMsg(null)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('tenants').insert({ user_id: user.id, ...form, expected_rent: Number(form.expected_rent) })
    if (error) setMsg({ type: 'error', text: error.message })
    else {
      setMsg({ type: 'success', text: `✅ Tenant "${form.name}" added!` })
      setForm({ name: '', expected_rent: 10000, property_name: '' })
      loadTenants()
    }
    setSaving(false)
  }

  async function handleUpdate(id) {
    const f = editForms[id]
    const { error } = await supabase.from('tenants').update({ name: f.name, expected_rent: Number(f.expected_rent), property_name: f.property_name }).eq('id', id)
    if (!error) { setMsg({ type: 'success', text: 'Saved!' }); setOpenId(null); loadTenants() }
    else setMsg({ type: 'error', text: error.message })
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete tenant "${name}"? This will also delete their payment history.`)) return
    await supabase.from('tenants').delete().eq('id', id)
    setTenants(prev => prev.filter(t => t.id !== id))
    setMsg({ type: 'info', text: `${name} deleted.` })
  }

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div className="page-title">⚙️ Settings</div>
        <div className="page-sub">Manage your tenants and expected rents</div>
      </div>

      {/* Add Tenant */}
      <div className="section-title">Add New Tenant</div>
      <div className="card" style={{ marginBottom: 28 }}>
        {msg && <div className={`alert alert-${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>}
        <form onSubmit={handleAdd}>
          <div className="form-row-3">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" placeholder="e.g. Rahul Sharma"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Monthly Rent (₹)</label>
              <input type="number" className="form-input" min="0" step="500"
                value={form.expected_rent} onChange={e => setForm(f => ({ ...f, expected_rent: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Property / Unit</label>
              <input type="text" className="form-input" placeholder="e.g. Flat 3B, Tower A"
                value={form.property_name} onChange={e => setForm(f => ({ ...f, property_name: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-gold btn-sm" disabled={saving}>
              {saving ? 'Saving…' : '➕ Add Tenant'}
            </button>
          </div>
        </form>
      </div>

      {/* Tenant List */}
      <div className="section-title">Existing Tenants</div>

      {tenants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <div className="empty-title">No tenants yet</div>
          <div className="empty-sub">Add your first tenant above.</div>
        </div>
      ) : (
        tenants.map(t => (
          <div className="expander" key={t.id}>
            <div className="expander-header" onClick={() => setOpenId(openId === t.id ? null : t.id)}>
              <div>
                <div className="expander-title">{t.name}</div>
                <div className="expander-meta">{t.property_name || 'No property'} · ₹{Number(t.expected_rent).toLocaleString('en-IN')}/mo</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="badge badge-gold">Active</span>
                <div className="icon-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    {openId === t.id
                      ? <polyline points="18 15 12 9 6 15"/>
                      : <polyline points="6 9 12 15 18 9"/>}
                  </svg>
                </div>
                <div className="icon-btn del" onClick={e => { e.stopPropagation(); handleDelete(t.id, t.name) }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                  </svg>
                </div>
              </div>
            </div>

            {openId === t.id && editForms[t.id] && (
              <div className="expander-body">
                <div className="form-row-3">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Name</label>
                    <input type="text" className="form-input"
                      value={editForms[t.id].name}
                      onChange={e => setEditForms(f => ({ ...f, [t.id]: { ...f[t.id], name: e.target.value } }))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Rent (₹)</label>
                    <input type="number" className="form-input" step="500"
                      value={editForms[t.id].expected_rent}
                      onChange={e => setEditForms(f => ({ ...f, [t.id]: { ...f[t.id], expected_rent: e.target.value } }))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Property</label>
                    <input type="text" className="form-input"
                      value={editForms[t.id].property_name}
                      onChange={e => setEditForms(f => ({ ...f, [t.id]: { ...f[t.id], property_name: e.target.value } }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button className="btn btn-gold btn-sm" onClick={() => handleUpdate(t.id)}>💾 Save</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setOpenId(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
