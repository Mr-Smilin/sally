import React, { useState } from 'react'
import { categoryApi } from '../api'

const ICONS = ['🍜','🍔','☕','🍺','🚌','🚗','✈️','🛍️','👔','💄','🏠','💡','📱','🎮','🎬','🏋️','💊','🏥','📚','🎓','💼','💰','📈','🎁','💸','🏦','🎯','⚽','🎵','🌟']
const COLORS = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#6b7280','#f97316','#84cc16']

export default function CategoryModal({ category, onClose, onSaved }) {
  const [name, setName] = useState(category?.name || '')
  const [icon, setIcon] = useState(category?.icon || '💰')
  const [color, setColor] = useState(category?.color || '#6366f1')
  const [type, setType] = useState(category?.type || 'EXPENSE')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      if (category) {
        await categoryApi.update(category.id, { name, icon, color })
      } else {
        await categoryApi.create({ name, icon, color, type })
      }
      onSaved()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{category ? '編輯分類' : '新增分類'}</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">✕</button>
          </div>

          {!category && (
            <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
              <button className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === 'EXPENSE' ? 'bg-red-500 text-white' : 'text-gray-500'}`} onClick={() => setType('EXPENSE')}>支出</button>
              <button className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === 'INCOME' ? 'bg-green-500 text-white' : 'text-gray-500'}`} onClick={() => setType('INCOME')}>收入</button>
            </div>
          )}

          <input className="input mb-4" placeholder="分類名稱" value={name} onChange={e => setName(e.target.value)} />

          <p className="text-sm font-medium text-gray-600 mb-2">選擇圖示</p>
          <div className="grid grid-cols-6 gap-2 mb-4">
            {ICONS.map(i => (
              <button key={i} onClick={() => setIcon(i)}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${icon === i ? 'bg-blue-100 ring-2 ring-blue-500 scale-90' : 'bg-gray-100 hover:bg-gray-200'}`}>
                {i}
              </button>
            ))}
          </div>

          <p className="text-sm font-medium text-gray-600 mb-2">選擇顏色</p>
          <div className="flex gap-2 mb-5">
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-90' : ''}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>

          <div className="flex gap-2">
            <button className="btn-secondary flex-1" onClick={onClose}>取消</button>
            <button className="btn-primary flex-1" onClick={handleSave} disabled={!name.trim() || loading}>
              {loading ? '儲存中...' : '儲存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
