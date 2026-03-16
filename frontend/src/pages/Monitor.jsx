import React, { useState, useEffect, useCallback } from 'react'
import { monitorApi, userApi } from '../api'
import { useToast } from '../context/ToastContext'

const ACTION_META = {
  AUTH_LOGIN:              { label: '登入',           icon: '🔑', color: 'bg-blue-100 text-blue-700' },
  AUTH_LOGOUT:             { label: '登出',           icon: '🚪', color: 'bg-gray-100 text-gray-600' },
  AUTH_REGISTER:           { label: '註冊',           icon: '🆕', color: 'bg-green-100 text-green-700' },
  AUTH_LOGIN_FAIL:         { label: '登入失敗',       icon: '❌', color: 'bg-red-100 text-red-700' },
  IP_BANNED:               { label: 'IP 封鎖',        icon: '🚫', color: 'bg-red-100 text-red-800' },
  IP_UNBAN:                { label: 'IP 解封',        icon: '✅', color: 'bg-green-100 text-green-700' },
  LOGIN_SETTING_UPDATE:    { label: '更新登入設定',   icon: '⚙️', color: 'bg-purple-100 text-purple-700' },
  TRANSACTION_CREATE:      { label: '新增記帳',       icon: '➕', color: 'bg-green-100 text-green-700' },
  TRANSACTION_UPDATE:      { label: '編輯記帳',       icon: '✏️', color: 'bg-yellow-100 text-yellow-700' },
  TRANSACTION_DELETE:      { label: '刪除記帳',       icon: '🗑️', color: 'bg-red-100 text-red-600' },
  CATEGORY_CREATE:         { label: '新增分類',       icon: '➕', color: 'bg-green-100 text-green-700' },
  CATEGORY_UPDATE:         { label: '編輯分類',       icon: '✏️', color: 'bg-yellow-100 text-yellow-700' },
  CATEGORY_DELETE:         { label: '刪除分類',       icon: '🗑️', color: 'bg-red-100 text-red-600' },
  CURRENCY_CREATE:         { label: '新增幣別',       icon: '💱', color: 'bg-green-100 text-green-700' },
  CURRENCY_UPDATE:         { label: '編輯幣別',       icon: '✏️', color: 'bg-yellow-100 text-yellow-700' },
  CURRENCY_DELETE:         { label: '刪除幣別',       icon: '🗑️', color: 'bg-red-100 text-red-600' },
  CURRENCY_SET_DEFAULT:    { label: '設預設幣別',     icon: '⭐', color: 'bg-amber-100 text-amber-700' },
  PROFILE_UPDATE:          { label: '更新個人資料',   icon: '👤', color: 'bg-blue-100 text-blue-700' },
  PASSWORD_CHANGE:         { label: '修改密碼',       icon: '🔒', color: 'bg-purple-100 text-purple-700' },
  ADMIN_CREATE_USER:       { label: '管理員新增用戶', icon: '➕', color: 'bg-green-100 text-green-700' },
  ADMIN_UPDATE_USER:       { label: '管理員修改用戶', icon: '⚙️', color: 'bg-amber-100 text-amber-700' },
  ADMIN_DELETE_USER:       { label: '管理員刪除用戶', icon: '🚫', color: 'bg-red-100 text-red-600' },
}

function meta(action) {
  return ACTION_META[action] || { label: action, icon: '📋', color: 'bg-gray-100 text-gray-600' }
}

function duration(from, to) {
  const ms = new Date(to) - new Date(from)
  if (ms < 0) return null
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  if (mins === 0) return `${secs} 秒`
  if (mins < 60) return `${mins} 分 ${secs} 秒`
  return `${Math.floor(mins / 60)} 小時 ${mins % 60} 分`
}

const fmtTime = (dt) => {
  const d = new Date(dt)
  return `${d.toLocaleDateString('zh-TW')} ${d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
}

// ── Tab: Audit Logs ──────────────────────────────────────────────────────────

function LogsTab() {
  const today = new Date().toISOString().split('T')[0]
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [filterUser, setFilterUser] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [users, setUsers] = useState([])
  const [actionTypes, setActionTypes] = useState([])
  const LIMIT = 50

  useEffect(() => {
    userApi.list().then(setUsers)
    monitorApi.actions().then(setActionTypes)
  }, [])

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res = await monitorApi.logs({
        userId: filterUser || undefined,
        action: filterAction || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: p,
        limit: LIMIT,
      })
      setLogs(res.logs)
      setTotal(res.total)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }, [filterUser, filterAction, startDate, endDate])

  useEffect(() => { load(1) }, [load])

  const logsWithDuration = logs.map((log, i) => {
    if (log.action !== 'AUTH_LOGIN') return log
    const nextLogout = logs.slice(i + 1).find(
      l => l.userId === log.userId && (l.action === 'AUTH_LOGOUT' || l.action === 'AUTH_LOGIN')
    )
    return { ...log, sessionDuration: nextLogout ? duration(nextLogout.createdAt, log.createdAt) : null }
  })

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div className="flex gap-2">
          <input type="date" className="input flex-1" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span className="text-gray-400 self-center text-sm">～</span>
          <input type="date" className="input flex-1" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <select className="input flex-1" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
            <option value="">全部用戶</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
          </select>
          <select className="input flex-1" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
            <option value="">全部行為</option>
            {actionTypes.map(a => <option key={a} value={a}>{meta(a).label}</option>)}
          </select>
        </div>
      </div>

      <p className="text-sm text-gray-400">共 {total} 筆紀錄</p>

      <div className="card divide-y divide-gray-50">
        {loading && <p className="p-6 text-center text-gray-400">載入中...</p>}
        {!loading && logs.length === 0 && <p className="p-6 text-center text-gray-400">無紀錄</p>}
        {logsWithDuration.map(log => {
          const m = meta(log.action)
          return (
            <div key={log.id} className="flex items-start gap-3 px-4 py-3">
              <span className={`mt-0.5 text-sm px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${m.color}`}>
                {m.icon} {m.label}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{log.username || '已刪除用戶'}</span>
                  {log.detail && <span className="text-xs text-gray-500 truncate">{log.detail}</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{fmtTime(log.createdAt)}</span>
                  {log.ip && <span className="text-xs text-gray-300">{log.ip}</span>}
                  {log.sessionDuration && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                      在線 {log.sessionDuration}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {total > LIMIT && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn-secondary" onClick={() => load(page - 1)} disabled={page === 1}>上一頁</button>
          <span className="text-sm text-gray-500">{page} / {Math.ceil(total / LIMIT)}</span>
          <button className="btn-secondary" onClick={() => load(page + 1)} disabled={page >= Math.ceil(total / LIMIT)}>下一頁</button>
        </div>
      )}
    </div>
  )
}

// ── Tab: IP Blacklist ────────────────────────────────────────────────────────

function IpBlacklistTab() {
  const { addToast } = useToast()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [newIp, setNewIp] = useState('')
  const [newReason, setNewReason] = useState('')
  const [adding, setAdding] = useState(false)

  const load = async () => {
    setLoading(true)
    try { setList(await monitorApi.ipBlacklist()) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleBan = async (e) => {
    e.preventDefault()
    if (!newIp.trim()) return
    setAdding(true)
    try {
      await monitorApi.banIp({ ip: newIp.trim(), reason: newReason.trim() })
      addToast(`已封鎖 ${newIp.trim()}`, 'success')
      setNewIp('')
      setNewReason('')
      load()
    } catch (err) {
      addToast(err.error || '操作失敗', 'error')
    } finally {
      setAdding(false)
    }
  }

  const handleUnban = async (ip) => {
    try {
      await monitorApi.unbanIp(ip)
      addToast(`已解封 ${ip}`, 'success')
      load()
    } catch (err) {
      addToast(err.error || '操作失敗', 'error')
    }
  }

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="card p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">手動封鎖 IP</p>
        <form onSubmit={handleBan} className="space-y-2">
          <div className="flex gap-2">
            <input
              className="input flex-1" placeholder="IP 位址" required
              value={newIp} onChange={e => setNewIp(e.target.value)}
            />
            <input
              className="input flex-1" placeholder="原因（選填）"
              value={newReason} onChange={e => setNewReason(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-danger w-full" disabled={adding}>
            {adding ? '封鎖中...' : '封鎖'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="card divide-y divide-gray-50">
        {loading && <p className="p-6 text-center text-gray-400">載入中...</p>}
        {!loading && list.length === 0 && <p className="p-6 text-center text-gray-400">目前無封鎖紀錄</p>}
        {list.map(entry => (
          <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
            <span className="text-sm font-mono font-medium text-gray-800 flex-1">{entry.ip}</span>
            <div className="flex-1 min-w-0">
              {entry.reason && <p className="text-xs text-gray-500 truncate">{entry.reason}</p>}
              <p className="text-xs text-gray-400">
                {fmtTime(entry.bannedAt)}
                {entry.bannedBy && ` · 由 ${entry.bannedBy}`}
              </p>
              {entry.expiresAt && (
                <p className="text-xs text-amber-600">
                  到期：{fmtTime(entry.expiresAt)}
                </p>
              )}
              {!entry.expiresAt && (
                <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">永久</span>
              )}
            </div>
            <button
              className="btn-secondary text-xs py-1.5 px-3"
              onClick={() => handleUnban(entry.ip)}
            >
              解封
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab: Login Settings ──────────────────────────────────────────────────────

function SettingsTab() {
  const { addToast } = useToast()
  const [form, setForm] = useState({ maxAttempts: 5, windowMinutes: 15, banMinutes: 0, allowRegistration: true })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    monitorApi.getSettings().then(s => setForm(s)).finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await monitorApi.saveSettings(form)
      addToast('設定已儲存', 'success')
    } catch (err) {
      addToast(err.error || '儲存失敗', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-center text-gray-400 py-8">載入中...</p>

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="card p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            最大失敗次數
          </label>
          <input
            type="number" min={1} max={100} required
            className="input"
            value={form.maxAttempts}
            onChange={e => setForm(f => ({ ...f, maxAttempts: Number(e.target.value) }))}
          />
          <p className="text-xs text-gray-400 mt-1">同一 IP 在時間窗口內達到此次數後自動封鎖</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            計算時間窗口（分鐘）
          </label>
          <input
            type="number" min={1} max={10080} required
            className="input"
            value={form.windowMinutes}
            onChange={e => setForm(f => ({ ...f, windowMinutes: Number(e.target.value) }))}
          />
          <p className="text-xs text-gray-400 mt-1">只計算此時間範圍內的失敗次數</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            封鎖時長（分鐘，0 = 永久）
          </label>
          <input
            type="number" min={0} max={525600} required
            className="input"
            value={form.banMinutes}
            onChange={e => setForm(f => ({ ...f, banMinutes: Number(e.target.value) }))}
          />
          <p className="text-xs text-gray-400 mt-1">
            0 = 永久封鎖，需手動解封；其他值 = 自動到期
          </p>
        </div>

        <div className="flex items-center justify-between py-2 border-t border-gray-100 mt-2 pt-4">
          <div>
            <p className="text-sm font-medium text-gray-700">開放公開註冊</p>
            <p className="text-xs text-gray-400 mt-0.5">關閉後首頁不顯示註冊頁籤，僅管理員可建立帳號</p>
          </div>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, allowRegistration: !f.allowRegistration }))}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form.allowRegistration ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.allowRegistration ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <button type="submit" className="btn-primary w-full py-3" disabled={saving}>
        {saving ? '儲存中...' : '儲存設定'}
      </button>
    </form>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'logs', label: '操作日誌', icon: '📋' },
  { id: 'blacklist', label: 'IP 封鎖', icon: '🚫' },
  { id: 'settings', label: '登入設定', icon: '⚙️' },
]

export default function Monitor() {
  const [tab, setTab] = useState('logs')

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">操作監測</h1>

      <div className="flex bg-gray-100 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'logs' && <LogsTab />}
      {tab === 'blacklist' && <IpBlacklistTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  )
}
