import React, { useState } from 'react'
import { userApi } from '../api'
import { useAuth } from '../context/AuthContext'

function Section({ title, children }) {
  return (
    <div className="card p-5">
      <h2 className="font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  )
}

export default function Profile() {
  const { user, login } = useAuth()

  const [info, setInfo] = useState({ username: user?.username || '', email: user?.email || '' })
  const [infoMsg, setInfoMsg] = useState(null)
  const [infoLoading, setInfoLoading] = useState(false)

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState(null)
  const [pwLoading, setPwLoading] = useState(false)

  const handleInfoSave = async () => {
    setInfoMsg(null)
    setInfoLoading(true)
    try {
      const updated = await userApi.updateMe(info)
      login(localStorage.getItem('token'), updated)
      setInfoMsg({ type: 'ok', text: '已更新' })
    } catch (err) {
      setInfoMsg({ type: 'err', text: err.error || '更新失敗' })
    } finally {
      setInfoLoading(false)
    }
  }

  const handlePwSave = async () => {
    setPwMsg(null)
    if (pw.newPassword !== pw.confirm) return setPwMsg({ type: 'err', text: '兩次密碼不一致' })
    if (pw.newPassword.length < 6) return setPwMsg({ type: 'err', text: '新密碼至少 6 個字元' })
    setPwLoading(true)
    try {
      await userApi.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword })
      setPw({ currentPassword: '', newPassword: '', confirm: '' })
      setPwMsg({ type: 'ok', text: '密碼已變更' })
    } catch (err) {
      setPwMsg({ type: 'err', text: err.error || '變更失敗' })
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">個人資料</h1>

      <Section title="基本資料">
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">用戶名</label>
            <input
              className="input w-full"
              value={info.username}
              onChange={e => setInfo(f => ({ ...f, username: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">電子郵件</label>
            <input
              className="input w-full" type="email"
              value={info.email}
              onChange={e => setInfo(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          {infoMsg && (
            <p className={`text-sm ${infoMsg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>{infoMsg.text}</p>
          )}
          <button className="btn-primary w-full py-3" onClick={handleInfoSave} disabled={infoLoading}>
            {infoLoading ? '儲存中...' : '儲存變更'}
          </button>
        </div>
      </Section>

      <Section title="修改密碼">
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">目前密碼</label>
            <input
              className="input w-full" type="password" placeholder="輸入目前密碼"
              value={pw.currentPassword}
              onChange={e => setPw(f => ({ ...f, currentPassword: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">新密碼</label>
            <input
              className="input w-full" type="password" placeholder="至少 6 個字元"
              value={pw.newPassword}
              onChange={e => setPw(f => ({ ...f, newPassword: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">確認新密碼</label>
            <input
              className="input w-full" type="password" placeholder="再次輸入新密碼"
              value={pw.confirm}
              onChange={e => setPw(f => ({ ...f, confirm: e.target.value }))}
            />
          </div>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>{pwMsg.text}</p>
          )}
          <button className="btn-primary w-full py-3" onClick={handlePwSave} disabled={pwLoading}>
            {pwLoading ? '變更中...' : '變更密碼'}
          </button>
        </div>
      </Section>
    </div>
  )
}
