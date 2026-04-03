import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function LogPayment() {
  const [tenants, setTenants] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [amount, setAmount] = useState(0)
  const [monthYear, setMonthYear] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`
  })
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => { loadTenants() }, [])

  async function loadTenants() {
    const { data } = await supabase.from('tenants').select('*').order('name')
    setTenants(data || [])
    if (data?.length) setAmount(Number(data[0].expected_rent))
    setLoading(false)
  }

  function handleTenantChange(e) {
    const idx = Number(e.target.value)
    setSelectedIdx(idx)
    setAmount(Number(tenants[idx].expected_rent))
    setMsg(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!amount || amount <= 0) { setMsg({ type: 'error', text: 'Amount must be greater than ₹0.' }); return }
    setSaving(true)
    setMsg(null)
    const t = tenants[selectedIdx]
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('payments').insert({
      user_id: user.id, tenant_id: t.id,
      amount: Number(amount), month_year: monthYear, note,
    })
    if (error) setMsg({ type: 'error', text: error.message })
    else {
      setMsg({ type: 'success', text: `✅ ₹${Number(amount).toLocaleString('en-IN')} logged for ${t.name}!` })
      setNote('')
    }
    setSaving(false)
  }

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>
  if (!tenants.length) return (
    <div>
      <div className="page-header">
        <div className="page-title">💰 Log Payment</div>
      </div>
      <div className="empty-state">
        <div className="empty-icon">👥</div>
        <div className="empty-title">No tenants found</div>
        <div className="empty-sub">Add tenants in Settings first.</div>
      </div>
    </div>
  )

  const tenant = tenants[selectedIdx]
  const diff = Number(amount) - Number(tenant?.expected_rent || 0)

  return (
    <div>
      <div className="page-header">
        <div className="page-title">💰 Log Payment</div>
        <div className="page-sub">Record rent received from a tenant</div>
      </div>

      <div className="two-col">
        <div className="card">
          {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Select Tenant</label>
              <select className="form-input" value={selectedIdx} onChange={handleTenantChange}>
                {tenants.map((t, i) => (
                  <option key={t.id} value={i}>
                    {t.name} — {t.property_name || 'No property'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Rent Received (₹)</label>
                <input
                  type="number" className="form-input" required min="1" step="100"
                  value={amount} onChange={e => setAmount(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">For Month</label>
                <input
                  type="date" className="form-input"
                  value={monthYear} onChange={e => setMonthYear(e.target.value)}
                />
              </div>
            </div>

            <div className="diff-row">
              <span className="diff-label">Expected: <strong>₹{Number(tenant?.expected_rent||0).toLocaleString('en-IN')}</strong></span>
              {diff === 0 && <span className="badge badge-green">✓ Exact amount</span>}
              {diff > 0  && <span className="badge badge-blue">⬆ ₹{diff.toLocaleString('en-IN')} extra</span>}
              {diff < 0  && <span className="badge badge-yellow">⬇ ₹{Math.abs(diff).toLocaleString('en-IN')} short</span>}
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Note (optional)</label>
              <input
                type="text" className="form-input"
                placeholder="e.g. UPI transfer, cash, NEFT…"
                value={note} onChange={e => setNote(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-gold btn-full" disabled={saving}>
              {saving ? 'Saving…' : '✅ Log Payment'}
            </button>
          </form>
        </div>

        <div className="tip-card">
          <div className="tip-title">Quick Tips</div>
          <div className="tip-item">💡 Amount auto-fills with expected rent. Edit only if different.</div>
          <div className="tip-item">📅 Set "For Month" to the month this payment covers, even if paid late.</div>
          <div className="tip-item">🗒️ Add UPI/NEFT in the Note field for a clean audit trail.</div>
          <div className="tip-item">⬇ Short payment? Log the balance separately later as another entry.</div>
        </div>
      </div>
    </div>
  )
}
