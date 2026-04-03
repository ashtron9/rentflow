import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function History() {
  const [payments, setPayments] = useState([])
  const [tenants, setTenants] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [t, p] = await Promise.all([
      supabase.from('tenants').select('*').order('name'),
      supabase.from('payments').select('*, tenants(name, property_name)').order('month_year', { ascending: false }).limit(200),
    ])
    setTenants(t.data || [])
    setPayments(p.data || [])
    setLoading(false)
  }

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>

  const filtered = filter === 'all' ? payments : payments.filter(p => p.tenant_id === filter)
  const total = filtered.reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div>
      <div className="page-header">
        <div className="page-title">📋 Payment History</div>
        <div className="page-sub">All recorded rent payments</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, maxWidth: 320 }}>
          <select className="form-input" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Tenants</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="kpi" style={{ padding: '12px 20px', minWidth: 160 }}>
            <div className="kpi-label">Total</div>
            <div className="kpi-value" style={{ fontSize: 22 }}>₹{total.toLocaleString('en-IN')}</div>
          </div>
          <div className="kpi" style={{ padding: '12px 20px', minWidth: 100 }}>
            <div className="kpi-label">Entries</div>
            <div className="kpi-value" style={{ fontSize: 22 }}>{filtered.length}</div>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No payments yet</div>
          <div className="empty-sub">Start logging payments on the Log Payment page.</div>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Tenant</th>
                <th>Property</th>
                <th>Amount (₹)</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>{p.month_year?.slice(0, 7)}</td>
                  <td style={{ color: 'var(--text)', fontWeight: 600 }}>{p.tenants?.name || '—'}</td>
                  <td>{p.tenants?.property_name || '—'}</td>
                  <td style={{ color: 'var(--gold2)', fontWeight: 700 }}>₹{Number(p.amount).toLocaleString('en-IN')}</td>
                  <td style={{ fontSize: 13 }}>{p.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
