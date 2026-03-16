import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { transactionApi, categoryApi, currencyApi, userApi } from '../api'
import { useAuth } from '../context/AuthContext'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'

function getMonthRange() {
  const now = new Date()
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const end = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
  return { start, end }
}

function ToggleGroup({ items, selected, onToggle, labelKey = 'name', valueKey = 'id' }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => {
        const val = item[valueKey]
        const active = selected.includes(val)
        return (
          <button
            key={val}
            onClick={() => onToggle(val)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {item.icon ? `${item.icon} ` : ''}{item[labelKey]}
          </button>
        )
      })}
    </div>
  )
}

export default function Reports() {
  const { isAdmin } = useAuth()
  const range = getMonthRange()

  const [startDate, setStartDate] = useState(range.start)
  const [endDate, setEndDate] = useState(range.end)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedCurrencies, setSelectedCurrencies] = useState([])

  const [users, setUsers] = useState([])
  const [categories, setCategories] = useState([])
  const [currencies, setCurrencies] = useState([])

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [filterOpen, setFilterOpen] = useState(true)
  const [sectionOpen, setSectionOpen] = useState({ date: true, users: false, categories: true, currencies: true })

  useEffect(() => {
    Promise.all([
      categoryApi.list(),
      currencyApi.list(),
      isAdmin ? userApi.list() : Promise.resolve([]),
    ]).then(([cats, curs, usrs]) => {
      setCategories(cats)
      setCurrencies(curs)
      setUsers(usrs)
    })
  }, [isAdmin])

  const toggle = (setter, current) => (val) => {
    setter(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const params = {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate + 'T23:59:59').toISOString(),
        ...(selectedUsers.length > 0 && { userIds: selectedUsers.join(',') }),
        ...(selectedCategories.length > 0 && { categoryIds: selectedCategories.join(',') }),
        ...(selectedCurrencies.length > 0 && { currencyIds: selectedCurrencies.join(',') }),
      }
      const data = await transactionApi.report(params)
      setTransactions(data)
      setGenerated(true)
      setFilterOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const rows = transactions.map(tx => ({
      日期: new Date(tx.date).toLocaleDateString('zh-TW'),
      類型: tx.type === 'EXPENSE' ? '支出' : '收入',
      分類: tx.category?.name || '',
      金額: Number(tx.amount),
      幣別: tx.currency?.code || '',
      符號: tx.currency?.symbol || '',
      備註: tx.note || '',
      ...(isAdmin && { 用戶: tx.user?.username || '' }),
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '記帳紀錄')
    XLSX.writeFile(wb, `記帳報表_${startDate}_${endDate}.xlsx`)
  }

  const fmt = (n) => Number(n).toLocaleString('zh-TW')

  // Derived stats
  const income = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0)
  const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0)

  const byCategory = Object.values(
    transactions.reduce((acc, t) => {
      const k = t.category?.name
      if (!acc[k]) acc[k] = { name: k, icon: t.category?.icon, color: t.category?.color, type: t.type, total: 0 }
      acc[k].total += Number(t.amount)
      return acc
    }, {})
  )
  const expenseByCategory = byCategory.filter(c => c.type === 'EXPENSE')
  const incomeByCategory = byCategory.filter(c => c.type === 'INCOME')

  const byCurrency = Object.values(
    transactions.reduce((acc, t) => {
      const k = t.currency?.code || 'N/A'
      if (!acc[k]) acc[k] = { code: k, symbol: t.currency?.symbol || '', income: 0, expense: 0 }
      if (t.type === 'INCOME') acc[k].income += Number(t.amount)
      else acc[k].expense += Number(t.amount)
      return acc
    }, {})
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">報表</h1>

      {/* Filters */}
      <div className="card overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          onClick={() => setFilterOpen(o => !o)}
        >
          <span className="font-semibold text-gray-700">篩選條件</span>
          <span className="text-gray-400 text-sm">{filterOpen ? '▲ 收起' : '▼ 展開'}</span>
        </button>

        {filterOpen && <div className="border-t border-gray-100 divide-y divide-gray-50">
          {/* 日期區間 */}
          <div>
            <button
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
              onClick={() => setSectionOpen(s => ({ ...s, date: !s.date }))}
            >
              <span className="font-medium text-gray-700">
                日期區間
                {!sectionOpen.date && <span className="ml-2 text-gray-400 font-normal">{startDate} ～ {endDate}</span>}
              </span>
              <span className="text-gray-300 text-xs">{sectionOpen.date ? '▲' : '▼'}</span>
            </button>
            {sectionOpen.date && (
              <div className="px-4 pb-3 flex gap-2 items-center">
                <input type="date" className="input flex-1" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <span className="text-gray-400 text-sm">～</span>
                <input type="date" className="input flex-1" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            )}
          </div>

          {/* 用戶（管理員） */}
          {isAdmin && users.length > 0 && (
            <div>
              <button
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                onClick={() => setSectionOpen(s => ({ ...s, users: !s.users }))}
              >
                <span className="font-medium text-gray-700">
                  用戶
                  {selectedUsers.length > 0 && <span className="ml-2 text-blue-600 font-normal">已選 {selectedUsers.length}</span>}
                  {selectedUsers.length === 0 && <span className="ml-2 text-gray-400 font-normal">全部</span>}
                </span>
                <span className="text-gray-300 text-xs">{sectionOpen.users ? '▲' : '▼'}</span>
              </button>
              {sectionOpen.users && (
                <div className="px-4 pb-3">
                  <ToggleGroup items={users} selected={selectedUsers} onToggle={toggle(setSelectedUsers, selectedUsers)} labelKey="username" />
                </div>
              )}
            </div>
          )}

          {/* 分類 */}
          <div>
            <button
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
              onClick={() => setSectionOpen(s => ({ ...s, categories: !s.categories }))}
            >
              <span className="font-medium text-gray-700">
                分類
                {selectedCategories.length > 0 && <span className="ml-2 text-blue-600 font-normal">已選 {selectedCategories.length}</span>}
                {selectedCategories.length === 0 && <span className="ml-2 text-gray-400 font-normal">全部</span>}
              </span>
              <span className="text-gray-300 text-xs">{sectionOpen.categories ? '▲' : '▼'}</span>
            </button>
            {sectionOpen.categories && (
              <div className="px-4 pb-3">
                <ToggleGroup items={categories} selected={selectedCategories} onToggle={toggle(setSelectedCategories, selectedCategories)} />
              </div>
            )}
          </div>

          {/* 幣別 */}
          <div>
            <button
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
              onClick={() => setSectionOpen(s => ({ ...s, currencies: !s.currencies }))}
            >
              <span className="font-medium text-gray-700">
                幣別
                {selectedCurrencies.length > 0 && <span className="ml-2 text-blue-600 font-normal">已選 {selectedCurrencies.length}</span>}
                {selectedCurrencies.length === 0 && <span className="ml-2 text-gray-400 font-normal">全部</span>}
              </span>
              <span className="text-gray-300 text-xs">{sectionOpen.currencies ? '▲' : '▼'}</span>
            </button>
            {sectionOpen.currencies && (
              <div className="px-4 pb-3">
                <ToggleGroup items={currencies} selected={selectedCurrencies} onToggle={toggle(setSelectedCurrencies, selectedCurrencies)} labelKey="code" />
              </div>
            )}
          </div>

          <div className="px-4 py-3">
            <button className="btn-primary w-full py-3" onClick={handleGenerate} disabled={loading}>
              {loading ? '產生中...' : '📊 產生報表'}
            </button>
          </div>
        </div>}
      </div>

      {/* Results */}
      {generated && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-4">
              <p className="text-xs text-gray-400 mb-1">收入</p>
              <p className="text-lg font-bold text-green-600">+{fmt(income)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-400 mb-1">支出</p>
              <p className="text-lg font-bold text-red-500">-{fmt(expense)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-gray-400 mb-1">結餘</p>
              <p className={`text-lg font-bold ${income - expense >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                {fmt(income - expense)}
              </p>
            </div>
          </div>

          {/* Expense pie */}
          {expenseByCategory.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold mb-3">支出分析</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    dataKey="total"
                    nameKey="name"
                    cx="50%" cy="50%"
                    outerRadius={85}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {expenseByCategory.map((cat, i) => <Cell key={i} fill={cat.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Income pie */}
          {incomeByCategory.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold mb-3">收入分析</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={incomeByCategory}
                    dataKey="total"
                    nameKey="name"
                    cx="50%" cy="50%"
                    outerRadius={85}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {incomeByCategory.map((cat, i) => <Cell key={i} fill={cat.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* By currency bar */}
          {byCurrency.length > 1 && (
            <div className="card p-4">
              <h3 className="font-semibold mb-3">幣別分佈</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={byCurrency}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="code" />
                  <YAxis />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="income" name="收入" fill="#10b981" />
                  <Bar dataKey="expense" name="支出" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Transaction count */}
          <p className="text-sm text-gray-400 text-center">共 {transactions.length} 筆記錄</p>

          {/* Export */}
          <button
            className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 active:scale-95 transition-all"
            onClick={handleExport}
            disabled={transactions.length === 0}
          >
            📥 匯出 Excel
          </button>
        </>
      )}
    </div>
  )
}
