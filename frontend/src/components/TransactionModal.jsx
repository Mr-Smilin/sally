import React, { useState, useEffect } from 'react'
import { categoryApi, transactionApi, currencyApi } from '../api'
import { useToast } from '../context/ToastContext'

const DIGITS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫']

export default function TransactionModal({ onClose, onSaved, transaction }) {
  const { addToast } = useToast()
  const [type, setType] = useState(transaction?.type || 'EXPENSE')
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || null)
  const [currencyId, setCurrencyId] = useState(transaction?.currencyId || null)
  const [note, setNote] = useState(transaction?.note || '')
  const [date, setDate] = useState(transaction?.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0])
  const [categories, setCategories] = useState([])
  const [currencies, setCurrencies] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([categoryApi.list(), currencyApi.list()]).then(([cats, curs]) => {
      setCategories(cats)
      setCurrencies(curs)
      if (!transaction) {
        const def = curs.find(c => c.isDefault) || curs[0]
        if (def) setCurrencyId(def.id)
      }
    })
  }, [])

  const filtered = categories.filter(c => c.type === type)
  const selectedCurrency = currencies.find(c => c.id === currencyId)

  const handleDigit = (d) => {
    if (d === '⌫') return setAmount(a => a.slice(0, -1))
    if (d === '.' && amount.includes('.')) return
    if (amount === '0' && d !== '.') return setAmount(d)
    if (amount.length >= 10) return
    if (amount.includes('.') && amount.split('.')[1]?.length >= 6) return
    setAmount(a => a + d)
  }

  const handleSave = async () => {
    if (!amount || !categoryId) return
    setLoading(true)
    try {
      const data = { amount: parseFloat(amount), type, categoryId, currencyId, note, date }
      if (transaction) {
        await transactionApi.update(transaction.id, data)
      } else {
        await transactionApi.create(data)
      }
      addToast(transaction ? '記帳已更新' : '記帳已儲存', 'success')
      onSaved()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{transaction ? '編輯記帳' : '新增記帳'}</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">✕</button>
          </div>

          {/* Type toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${type === 'EXPENSE' ? 'bg-red-500 text-white shadow' : 'text-gray-500'}`}
              onClick={() => { setType('EXPENSE'); setCategoryId(null) }}
            >支出</button>
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${type === 'INCOME' ? 'bg-green-500 text-white shadow' : 'text-gray-500'}`}
              onClick={() => { setType('INCOME'); setCategoryId(null) }}
            >收入</button>
          </div>

          {/* Amount display */}
          <div className={`text-right p-4 rounded-xl mb-4 ${type === 'EXPENSE' ? 'bg-red-50' : 'bg-green-50'}`}>
            <span className="text-gray-400 text-lg mr-1">{type === 'EXPENSE' ? '-' : '+'} {selectedCurrency?.symbol || 'NT$'}</span>
            <span className={`text-4xl font-bold ${type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}`}>
              {amount || '0'}
            </span>
          </div>

          {/* Categories */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {filtered.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                className={`flex flex-col items-center py-3 rounded-xl text-sm font-medium transition-all ${
                  categoryId === cat.id ? 'ring-2 ring-blue-500 bg-blue-50 scale-95' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-xs text-gray-600 truncate w-full text-center px-1">{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Currency selector */}
          {currencies.length > 0 && (
            <div className="mb-4">
              <div className="flex gap-2 flex-wrap">
                {currencies.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCurrencyId(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      currencyId === c.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {c.symbol} {c.code}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note & Date */}
          <div className="flex flex-col gap-2 mb-4">
            <input
              className="input w-full" placeholder="備註（選填）"
              value={note} onChange={e => setNote(e.target.value)}
            />
            <input
              type="date" className="input w-full"
              value={date} onChange={e => setDate(e.target.value)}
            />
          </div>

          {/* Number pad */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {DIGITS.map(d => (
              <button
                key={d}
                onClick={() => handleDigit(d)}
                className={`py-4 rounded-xl text-xl font-semibold transition-all active:scale-95 ${
                  d === '⌫' ? 'bg-red-50 text-red-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >{d}</button>
            ))}
          </div>

          {/* Save */}
          <button
            className={`w-full py-4 rounded-xl text-white text-lg font-bold transition-all active:scale-95 disabled:opacity-50 ${
              type === 'EXPENSE' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
            onClick={handleSave}
            disabled={!amount || !categoryId || loading}
          >
            {loading ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  )
}
