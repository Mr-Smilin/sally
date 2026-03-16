import React, { useState, useEffect } from 'react'
import { currencyApi } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Currencies() {
  const { isAdmin } = useAuth()
  const [currencies, setCurrencies] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ code: '', name: '', symbol: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const list = await currencyApi.list()
    setCurrencies(list)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm({ code: '', name: '', symbol: '' })
    setError('')
    setShowForm(true)
  }

  const openEdit = (c) => {
    setEditItem(c)
    setForm({ code: c.code, name: c.name, symbol: c.symbol })
    setError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.symbol || (!editItem && !form.code)) {
      setError('請填寫所有欄位')
      return
    }
    setLoading(true)
    setError('')
    try {
      if (editItem) {
        await currencyApi.update(editItem.id, { name: form.name, symbol: form.symbol })
      } else {
        await currencyApi.create({ code: form.code, name: form.name, symbol: form.symbol })
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.error || '操作失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (id) => {
    await currencyApi.setDefault(id)
    load()
  }

  const handleDelete = async (c) => {
    if (!confirm(`確定刪除 ${c.name}？`)) return
    try {
      await currencyApi.delete(c.id)
      load()
    } catch (err) {
      alert(err.error || '刪除失敗')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">幣別管理</h1>
        {isAdmin && (
          <button onClick={openAdd} className="btn-primary py-2">＋ 新增</button>
        )}
      </div>

      <div className="card divide-y divide-gray-100">
        {currencies.map(c => (
          <div key={c.id} className="flex items-center gap-4 px-4 py-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-lg font-bold text-blue-700">
              {c.symbol}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-gray-400">{c.code}</span>
                {c.isDefault && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">預設</span>
                )}
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                {!c.isDefault && (
                  <button
                    onClick={() => handleSetDefault(c.id)}
                    className="btn bg-green-50 text-green-700 hover:bg-green-100 text-sm py-1.5"
                  >
                    設為預設
                  </button>
                )}
                <button onClick={() => openEdit(c)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm">✏️</button>
                {!c.isDefault && (
                  <button onClick={() => handleDelete(c)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-sm">🗑️</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-sm rounded-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editItem ? '編輯幣別' : '新增幣別'}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">✕</button>
            </div>

            <div className="space-y-3">
              {!editItem && (
                <input
                  className="input" placeholder="代碼（如 TWD、USD）"
                  value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                />
              )}
              <input
                className="input" placeholder="名稱（如 新台幣）"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <input
                className="input" placeholder="符號（如 NT$、$）"
                value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            <div className="flex gap-2 mt-4">
              <button className="btn-secondary flex-1" onClick={() => setShowForm(false)}>取消</button>
              <button className="btn-primary flex-1" onClick={handleSave} disabled={loading}>
                {loading ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
