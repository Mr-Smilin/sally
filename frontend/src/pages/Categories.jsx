import React, { useState, useEffect } from 'react'
import { categoryApi } from '../api'
import CategoryModal from '../components/CategoryModal'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [editCat, setEditCat] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState('EXPENSE')

  const load = async () => {
    const cats = await categoryApi.list()
    setCategories(cats)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('確定刪除此分類？')) return
    await categoryApi.delete(id)
    load()
  }

  const filtered = categories.filter(c => c.type === tab)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">分類管理</h1>
        <button onClick={() => { setEditCat(null); setShowModal(true) }} className="btn-primary py-2">＋ 新增</button>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1">
        <button className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'EXPENSE' ? 'bg-white shadow text-red-500' : 'text-gray-500'}`} onClick={() => setTab('EXPENSE')}>支出分類</button>
        <button className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'INCOME' ? 'bg-white shadow text-green-600' : 'text-gray-500'}`} onClick={() => setTab('INCOME')}>收入分類</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map(cat => (
          <div key={cat.id} className="card p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: cat.color + '20' }}>
              {cat.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{cat.name}</p>
              {cat.isGlobal && <p className="text-xs text-gray-400">系統預設</p>}
            </div>
            {!cat.isGlobal && (
              <div className="flex flex-col gap-1">
                <button onClick={() => { setEditCat(cat); setShowModal(true) }} className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs">✏️</button>
                <button onClick={() => handleDelete(cat.id)} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs">🗑️</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <CategoryModal
          category={editCat}
          onClose={() => { setShowModal(false); setEditCat(null) }}
          onSaved={() => { setShowModal(false); setEditCat(null); load() }}
        />
      )}
    </div>
  )
}
