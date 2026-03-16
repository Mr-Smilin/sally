import React, { useState, useEffect, useRef } from 'react'
import { preferencesApi } from '../api'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const TYPES = [
  { value: 'default',  label: '預設',  icon: '🖥️' },
  { value: 'color',    label: '純色',  icon: '🎨' },
  { value: 'gradient', label: '漸層',  icon: '🌈' },
  { value: 'image',    label: '圖片',  icon: '🖼️' },
]

function buildPreviewStyle(form) {
  if (form.backgroundType === 'color') return { backgroundColor: form.backgroundColor }
  if (form.backgroundType === 'gradient') return {
    background: `linear-gradient(${form.gradientAngle}deg, ${form.gradientFrom}, ${form.gradientTo})`,
  }
  if (form.backgroundType === 'image' && form.backgroundImage) return {
    backgroundImage: `url(${form.backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
  return { backgroundColor: '#f9fafb' }
}

export default function Appearance() {
  const { pref, reload } = useTheme()
  const { user } = useAuth()
  const fileRef = useRef()
  const avatarRef = useRef()

  const [form, setForm] = useState({
    backgroundType: 'default',
    backgroundColor: '#6366f1',
    gradientFrom: '#667eea',
    gradientTo: '#764ba2',
    gradientAngle: 135,
    backgroundImage: null,
    customCss: '',
    welcomeText: '',
    avatarImage: null,
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [imgName, setImgName] = useState('')

  useEffect(() => {
    if (pref) setForm(f => ({ ...f, ...pref }))
  }, [pref])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) {
      setMsg({ type: 'err', text: '圖片大小不能超過 3MB' })
      return
    }
    setImgName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => set('backgroundImage', ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    setMsg(null)
    try {
      await preferencesApi.save(form)
      reload()
      setMsg({ type: 'ok', text: '已套用' })
    } catch (err) {
      setMsg({ type: 'err', text: err?.error || '儲存失敗' })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    const reset = { backgroundType: 'default', backgroundColor: '#f9fafb', gradientFrom: '#667eea', gradientTo: '#764ba2', gradientAngle: 135, backgroundImage: null, customCss: '', welcomeText: '', avatarImage: null }
    setForm(reset)
    setSaving(true)
    try {
      await preferencesApi.save(reset)
      reload()
      setMsg({ type: 'ok', text: '已恢復預設' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">外觀設定</h1>

      {/* Preview */}
      <div
        className="w-full h-28 rounded-2xl border border-gray-200 flex items-center justify-center text-white font-semibold text-lg shadow-inner"
        style={buildPreviewStyle(form)}
      >
        <span className="bg-black/20 px-4 py-1 rounded-full backdrop-blur-sm text-sm">預覽效果</span>
      </div>

      {/* Background type */}
      <div className="card p-4 space-y-4">
        <p className="font-semibold text-gray-700">背景類型</p>
        <div className="grid grid-cols-4 gap-2">
          {TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => set('backgroundType', t.value)}
              className={`flex flex-col items-center py-3 rounded-xl transition-all ${
                form.backgroundType === t.value
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-2xl mb-1">{t.icon}</span>
              <span className="text-xs font-medium">{t.label}</span>
            </button>
          ))}
        </div>

        {/* 純色 */}
        {form.backgroundType === 'color' && (
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">顏色</label>
            <input
              type="color" value={form.backgroundColor}
              onChange={e => set('backgroundColor', e.target.value)}
              className="w-12 h-10 rounded-lg cursor-pointer border border-gray-200"
            />
            <input
              className="input flex-1" value={form.backgroundColor}
              onChange={e => set('backgroundColor', e.target.value)}
              placeholder="#6366f1"
            />
          </div>
        )}

        {/* 漸層 */}
        {form.backgroundType === 'gradient' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 w-10">起點</label>
              <input type="color" value={form.gradientFrom} onChange={e => set('gradientFrom', e.target.value)}
                className="w-12 h-10 rounded-lg cursor-pointer border border-gray-200" />
              <input className="input flex-1" value={form.gradientFrom} onChange={e => set('gradientFrom', e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 w-10">終點</label>
              <input type="color" value={form.gradientTo} onChange={e => set('gradientTo', e.target.value)}
                className="w-12 h-10 rounded-lg cursor-pointer border border-gray-200" />
              <input className="input flex-1" value={form.gradientTo} onChange={e => set('gradientTo', e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 w-10">角度</label>
              <input type="range" min="0" max="360" value={form.gradientAngle}
                onChange={e => set('gradientAngle', Number(e.target.value))}
                className="flex-1" />
              <span className="text-sm text-gray-500 w-12 text-right">{form.gradientAngle}°</span>
            </div>
          </div>
        )}

        {/* 圖片 */}
        {form.backgroundType === 'image' && (
          <div className="space-y-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            <button
              onClick={() => fileRef.current.click()}
              className="btn-secondary w-full py-3"
            >
              {imgName || (form.backgroundImage ? '重新上傳圖片' : '選擇圖片（最大 3MB）')}
            </button>
            {imgName && <p className="text-xs text-gray-400 text-center">{imgName}</p>}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="card p-4 space-y-3">
        <p className="font-semibold text-gray-700">個人頭像</p>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-blue-100 flex items-center justify-center">
            {form.avatarImage
              ? <img src={form.avatarImage} className="w-full h-full object-cover" />
              : <span className="text-blue-700 font-bold text-2xl">{user?.username?.[0]?.toUpperCase()}</span>
            }
          </div>
          <div className="flex gap-2 flex-1">
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={e => {
              const file = e.target.files[0]
              if (!file) return
              if (file.size > 1 * 1024 * 1024) { setMsg({ type: 'err', text: '頭像大小不能超過 1MB' }); return }
              const reader = new FileReader()
              reader.onload = ev => set('avatarImage', ev.target.result)
              reader.readAsDataURL(file)
            }} />
            <button className="btn-secondary flex-1 py-2 text-sm" onClick={() => avatarRef.current.click()}>
              上傳圖片
            </button>
            {form.avatarImage && (
              <button className="btn-secondary py-2 px-3 text-sm text-red-500 hover:bg-red-50" onClick={() => set('avatarImage', null)}>
                移除
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400">支援 JPG、PNG，最大 1MB</p>
      </div>

      {/* Welcome text */}
      <div className="card p-4 space-y-2">
        <p className="font-semibold text-gray-700">首頁問候語</p>
        <input
          className="input"
          placeholder="你好"
          maxLength={30}
          value={form.welcomeText || ''}
          onChange={e => set('welcomeText', e.target.value)}
        />
        <p className="text-xs text-gray-400">
          預覽：「{form.welcomeText || '你好'}，{'{用戶名}'} 👋」
        </p>
      </div>

      {/* Custom CSS */}
      <div className="card p-4 space-y-2">
        <p className="font-semibold text-gray-700">自訂 CSS <span className="text-xs font-normal text-gray-400">（進階）</span></p>
        <textarea
          className="input w-full font-mono text-sm"
          rows={6}
          placeholder={`.card { border-radius: 20px; }\n.btn-primary { background: #7c3aed; }`}
          value={form.customCss || ''}
          onChange={e => set('customCss', e.target.value)}
        />
      </div>

      {/* Actions */}
      {msg && <p className={`text-sm text-center ${msg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>{msg.text}</p>}
      <div className="flex gap-2">
        <button className="btn-secondary flex-1 py-3" onClick={handleReset} disabled={saving}>恢復預設</button>
        <button className="btn-primary flex-1 py-3" onClick={handleSave} disabled={saving}>
          {saving ? '套用中...' : '套用'}
        </button>
      </div>
    </div>
  )
}
