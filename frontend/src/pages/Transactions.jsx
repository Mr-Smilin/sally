import React, { useState, useEffect, useCallback } from 'react'
import { transactionApi, userApi } from '../api'
import { useAuth } from '../context/AuthContext'
import TransactionModal from '../components/TransactionModal'

function getMonthRange() {
  const now = new Date()
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const end = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
  return { start, end }
}

export default function Transactions() {
  const { isAdmin } = useAuth()
  const defaultRange = getMonthRange()

  const [transactions, setTransactions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [startDate, setStartDate] = useState(defaultRange.start)
  const [endDate, setEndDate] = useState(defaultRange.end)
  const [filterUserId, setFilterUserId] = useState('')
  const [users, setUsers] = useState([])
  const [editTx, setEditTx] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const LIMIT = 20

  useEffect(() => {
    if (isAdmin) userApi.list().then(setUsers)
  }, [isAdmin])

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res = await transactionApi.list({
        search,
        type,
        page: p,
        limit: LIMIT,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined,
        userId: filterUserId || undefined,
      })
      setTransactions(res.transactions)
      setTotal(res.total)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }, [search, type, startDate, endDate, filterUserId])

  useEffect(() => { load(1) }, [load])

  const handleDelete = async (id) => {
    if (!confirm('確定刪除？')) return
    await transactionApi.delete(id)
    load(page)
  }

  const fmt = (n) => Number(n).toLocaleString('zh-TW')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">記帳紀錄</h1>
        <button onClick={() => { setEditTx(null); setShowModal(true) }} className="btn-primary py-2">＋ 新增</button>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <input
          className="input w-full" placeholder="搜尋備註..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="input w-full" value={type} onChange={e => setType(e.target.value)}>
          <option value="">全部類型</option>
          <option value="EXPENSE">支出</option>
          <option value="INCOME">收入</option>
        </select>
        <div className="flex gap-2 items-center">
          <input type="date" className="input flex-1" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span className="text-gray-400 text-sm flex-shrink-0">～</span>
          <input type="date" className="input flex-1" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        {isAdmin && (
          <select className="input w-full" value={filterUserId} onChange={e => setFilterUserId(e.target.value)}>
            <option value="">全部用戶</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
          </select>
        )}
      </div>

      {/* List */}
      <div className="card divide-y divide-gray-50">
        {loading && <p className="p-6 text-center text-gray-400">載入中...</p>}
        {!loading && transactions.length === 0 && <p className="p-6 text-center text-gray-400">暫無記錄</p>}
        {transactions.map(tx => (
          <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
            <span className="text-2xl">{tx.category?.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{tx.category?.name}</p>
                {isAdmin && tx.user && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{tx.user.username}</span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {tx.note ? `${tx.note} · ` : ''}{new Date(tx.date).toLocaleDateString('zh-TW')}
              </p>
            </div>
            <p className={`font-semibold ${tx.type === 'EXPENSE' ? 'text-red-500' : 'text-green-600'}`}>
              {tx.type === 'EXPENSE' ? '-' : '+'}{tx.currency?.symbol || 'NT$'} {fmt(tx.amount)}
            </p>
            <div className="flex gap-1 ml-2">
              <button onClick={() => { setEditTx(tx); setShowModal(true) }} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm">✏️</button>
              <button onClick={() => handleDelete(tx.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-sm">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn-secondary" onClick={() => load(page - 1)} disabled={page === 1}>上一頁</button>
          <span className="text-sm text-gray-500">{page} / {Math.ceil(total / LIMIT)}</span>
          <button className="btn-secondary" onClick={() => load(page + 1)} disabled={page >= Math.ceil(total / LIMIT)}>下一頁</button>
        </div>
      )}

      {showModal && (
        <TransactionModal
          transaction={editTx}
          onClose={() => { setShowModal(false); setEditTx(null) }}
          onSaved={() => { setShowModal(false); setEditTx(null); load(page) }}
        />
      )}
    </div>
  )
}
