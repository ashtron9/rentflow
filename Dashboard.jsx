import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const [tenants, setTenants] = useState([])
  const [payments, setPayments] = useState([])
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [t, p, r] = await Promise.all([
      supabase.from('tenants').select('*').order('name'),
      supabase.from('payments').select('*, tenants(name,expected_rent)'),
      supabase.from('reminders').select('*').order('reminder_date'),
    ])
    setTenants(t.data || [])

    // Filter payments to this month
    const today = new Date()
    const y = today.getFullYear(), m = String(today.getMonth() + 1).padStart(2, '0')
    const filtered = (p.data || []).filter(pay => {
      const d = pay.month_year?.slice(0, 7)
      return d === `${y}-${m}`
    })
    setPayments(filtered)
    setReminders(r.data || [])
    setLoading(false)
  }

  if (loading) return (
    <div className="loading-wrap">
      <div className="spinner" />
      <p>Loading dashboard…</p>
    </div>
  )

  if (!tenants.length) return (
    <div>
      <div className="page-header">
        <div className="page-title">Good day, Landlord 👋</div>
        <div className="page-sub">Welcome to RentFlow</div>
      </div>
      <div className="empty-state">
        <div className="empty-icon">🏘️</div>
        <div className="empty-title">No tenants yet</div>
        <div className="empty-sub" style={{ marginBottom: 20 }}>Go to Settings to add your first tenant and get started.</div>
        <button className="btn btn-gold" onClick={() => navigate('/settings')}>
          Go to Settings →
        </button>
      </div>
    </div>
  )

  const paidIds = new Set(payments.map(p => p.tenant_id))
  const paidAmount = payments.reduce((s, p) => s + Number(p.amount), 0)
  const expectedTotal = tenants.reduce((s, t) => s + Number(t.expected_rent), 0)
  const pendingCount = tenants.filter(t => !paidIds.has(t.id)).length
  const pct = expectedTotal ? Math.round(paidAmount / expectedTotal * 100) : 0

  const today = new Date()
  const urgent = reminders.filter(r => {
    const d = new Date(r.reminder_date)
    const diff = Math.round((d - today) / 86400000)
    return diff <= 30
  }).sort((a, b) => new Date(a.reminder_date) - new Date(b.reminder_date)).slice(0, 3)

  const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' })

  function daysLeft(dateStr) {
    return Math.round((new Date(dateStr) - today) / 86400000)
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Good day, Landlord 👋</div>
        <div className="page-sub">Here's your rental overview for {monthName}</div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">Total Tenants</div>
          <div className="kpi-value">{tenants.length}</div>
          <div className="kpi-sub">properties tracked</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Collected</div>
          <div className="kpi-value">₹{paidAmount.toLocaleString('en-IN')}</div>
          <div className="kpi-sub">{pct}% of expected</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Expected Total</div>
          <div className="kpi-value">₹{expectedTotal.toLocaleString('en-IN')}</div>
          <div className="kpi-sub">this month</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Awaiting</div>
          <div className="kpi-value">{pendingCount}</div>
          <div className="kpi-sub">tenants pending</div>
        </div>
      </div>

      {/* Progress */}
      <div className="prog-card">
        <div className="prog-header">
          <div className="prog-title">Collection Progress — {monthName}</div>
          <div className="prog-pct">{pct}%</div>
        </div>
        <div className="prog-bar">
          <div className="prog-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </div>

      {/* Tenant Status */}
      <div className="section-title">Tenant Status</div>
      <div className="tenant-list">
        {tenants.map(t => {
          const paid = paidIds.has(t.id)
          const paidAmt = payments.find(p => p.tenant_id === t.id)?.amount || 0
          const diff = Number(paidAmt) - Number(t.expected_rent)
          return (
            <div className="tenant-row" key={t.id}>
              <div>
                <div className="t-name">{t.name}</div>
                <div className="t-prop">📍 {t.property_name || '—'}</div>
              </div>
              <div className="t-right">
                <span className="t-exp">Expected: <strong>₹{Number(t.expected_rent).toLocaleString('en-IN')}</strong></span>
                {paid ? (
                  <>
                    <span className="badge badge-green">✓ Paid ₹{Number(paidAmt).toLocaleString('en-IN')}</span>
                    {diff > 0 && <span className="badge badge-blue">+₹{diff.toLocaleString('en-IN')} extra</span>}
                    {diff < 0 && <span className="badge badge-yellow">₹{Math.abs(diff).toLocaleString('en-IN')} short</span>}
                  </>
                ) : (
                  <span className="badge badge-red">⏳ Pending</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Urgent Reminders */}
      {urgent.length > 0 && (
        <>
          <div className="gold-divider" />
          <div className="section-title">⚡ Upcoming Reminders</div>
          {urgent.map(r => {
            const dl = daysLeft(r.reminder_date)
            const cls = dl < 0 ? 'rem-overdue' : 'rem-soon'
            const badge = dl < 0
              ? <span className="badge badge-red">Overdue {Math.abs(dl)}d</span>
              : dl === 0
              ? <span className="badge badge-red">Today!</span>
              : <span className="badge badge-yellow">In {dl}d</span>
            return (
              <div className={`rem-card ${cls}`} key={r.id}>
                <div>
                  <div className="rem-type">{r.reminder_type}</div>
                  <div className="rem-prop">{r.property_name}</div>
                </div>
                <div className="rem-right">
                  <span className="rem-date">📅 {r.reminder_date}</span>
                  {badge}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
