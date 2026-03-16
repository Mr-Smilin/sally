import React, { useState, useEffect } from 'react'
import { userApi } from '../api'
import { useToast } from '../context/ToastContext'

const ROLE_LABEL = { ADMIN: '管理員', USER: '一般用戶' }

function CreateModal({ onClose, onSaved }) {
  const { addToast } = useToast()
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'USER' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setError('')
    if (form.password.length < 6) return setError('密碼至少 6 個字元')
    setLoading(true)
    try {
      await userApi.create(form)
      addToast(`用戶 ${form.username} 已建立`, 'success')
      onSaved()
    } catch (err) {
      setError(err.error || '建立失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-2xl p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">新增用戶</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">✕</button>
        </div>

        <div className="space-y-3">
          <input
            className="input w-full" placeholder="用戶名" required
            value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
          />
          <input
            className="input w-full" type="email" placeholder="電子郵件" required
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
          <input
            className="input w-full" type="password" placeholder="密碼（至少 6 個字元）" required
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          />
          <div>
            <label className="text-sm text-gray-500 mb-1 block">角色</label>
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${form.role === 'USER' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                onClick={() => setForm(f => ({ ...f, role: 'USER' }))}
              >一般用戶</button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${form.role === 'ADMIN' ? 'bg-amber-500 shadow text-white' : 'text-gray-500'}`}
                onClick={() => setForm(f => ({ ...f, role: 'ADMIN' }))}
              >管理員</button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button className="btn-secondary flex-1" onClick={onClose}>取消</button>
            <button className="btn-primary flex-1" onClick={handleSave} disabled={loading}>
              {loading ? '建立中...' : '建立'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditModal({ user, onClose, onSaved }) {
  const { addToast } = useToast()
  const [form, setForm] = useState({
    username: user.username,
    email: user.email,
    newPassword: '',
    role: user.role,
    isActive: user.isActive,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setError('')
    if (form.newPassword && form.newPassword.length < 6) {
      return setError('新密碼至少 6 個字元')
    }
    setLoading(true)
    try {
      const data = {
        username: form.username,
        email: form.email,
        role: form.role,
        isActive: form.isActive,
        ...(form.newPassword && { newPassword: form.newPassword }),
      }
      await userApi.update(user.id, data)
      addToast('用戶資料已更新', 'success')
      onSaved()
    } catch (err) {
      setError(err.error || '更新失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-2xl p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">編輯用戶</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">✕</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">用戶名</label>
            <input
              className="input w-full"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">電子郵件</label>
            <input
              className="input w-full" type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">重設密碼（不填則不變更）</label>
            <input
              className="input w-full" type="password" placeholder="輸入新密碼"
              value={form.newPassword}
              onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">角色</label>
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${form.role === 'USER' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                onClick={() => setForm(f => ({ ...f, role: 'USER' }))}
              >一般用戶</button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${form.role === 'ADMIN' ? 'bg-amber-500 shadow text-white' : 'text-gray-500'}`}
                onClick={() => setForm(f => ({ ...f, role: 'ADMIN' }))}
              >管理員</button>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">帳號狀態</span>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
          <p className={`text-xs ${form.isActive ? 'text-green-600' : 'text-red-500'}`}>
            {form.isActive ? '帳號啟用中' : '帳號已停用'}
          </p>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button className="btn-secondary flex-1" onClick={onClose}>取消</button>
            <button className="btn-primary flex-1" onClick={handleSave} disabled={loading}>
              {loading ? '儲存中...' : '儲存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Users() {
  const { addToast } = useToast()
  const [users, setUsers] = useState([])
  const [editUser, setEditUser] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  const load = async () => {
    const u = await userApi.list()
    setUsers(u)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (user) => {
    if (!confirm(`確定刪除用戶 ${user.username}？此操作不可逆。`)) return
    try {
      await userApi.delete(user.id)
      addToast(`用戶 ${user.username} 已刪除`, 'success')
      load()
    } catch (err) {
      addToast(err.error || '刪除失敗', 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">用戶管理</h1>
        <button className="btn-primary py-2 px-4 text-sm" onClick={() => setShowCreate(true)}>
          ＋ 新增用戶
        </button>
      </div>

      <div className="card divide-y divide-gray-100">
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0">
              {u.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{u.username}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                  {ROLE_LABEL[u.role]}
                </span>
                {!u.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">已停用</span>}
              </div>
              <p className="text-sm text-gray-400 truncate">{u.email}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setEditUser(u)}
                className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm"
              >✏️</button>
              <button
                onClick={() => handleDelete(u)}
                className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-sm"
              >🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); load() }}
        />
      )}
      {editUser && (
        <EditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); load() }}
        />
      )}
    </div>
  )
}
