import { useState } from 'react'
import { useStore } from '../store'

export function Settings() {
  const { user, setUserName, clearAll } = useStore()
  const [name, setName] = useState(user.name)
  const [saved, setSaved] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  function handleSave() {
    setUserName(name)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleClear() {
    clearAll()
    setConfirmClear(false)
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    border: '1px solid #d1c5b4', borderRadius: 8,
    fontSize: 15, background: '#fffcf7',
    outline: 'none', boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: '#6b5a47', marginBottom: 6,
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 800, color: '#2c2416' }}>⚙️ Настройки</h1>

      <div style={{
        background: '#fff', border: '1px solid #e7ddd0',
        borderRadius: 12, padding: '24px', marginBottom: 20,
      }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#2c2416' }}>Личный профиль</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Ваше имя (для подписи действий)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Иванова А.С."
            style={fieldStyle}
          />
        </div>
        <button
          onClick={handleSave}
          style={{
            background: '#92650a', color: '#fff',
            border: 'none', borderRadius: 8,
            padding: '10px 24px', fontSize: 15, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {saved ? '✓ Сохранено' : 'Сохранить'}
        </button>
      </div>

      <div style={{
        background: '#fffbeb', border: '1px solid #fcd34d',
        borderRadius: 12, padding: '20px', marginBottom: 20,
      }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#92400e' }}>ℹ️ Общие данные</h2>
        <p style={{ fontSize: 14, color: '#78350f', lineHeight: 1.6 }}>
          Данные о делах и процессах хранятся в локальном хранилище браузера и видны
          всем, кто открывает это приложение в данном браузере на данном устройстве.
          Ваше имя сохраняется только для вас и не передаётся другим.
        </p>
      </div>

      <div style={{
        background: '#fff', border: '1px solid #fca5a5',
        borderRadius: 12, padding: '20px',
      }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#991b1b' }}>⚠️ Опасная зона</h2>
        <p style={{ fontSize: 14, color: '#6b5a47', marginBottom: 14, lineHeight: 1.6 }}>
          Полностью очистить все данные: удалить все дела и сбросить процессы к предустановленным.
          Это действие нельзя отменить.
        </p>
        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            style={{
              background: '#fee2e2', color: '#991b1b',
              border: '1px solid #fca5a5', borderRadius: 8,
              padding: '10px 20px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Очистить все данные
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleClear} style={{
              background: '#dc2626', color: '#fff',
              border: 'none', borderRadius: 8,
              padding: '10px 20px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
            }}>
              Да, удалить всё
            </button>
            <button onClick={() => setConfirmClear(false)} style={{
              background: '#f5ede0', color: '#6b5a47',
              border: '1px solid #e2d5c3', borderRadius: 8,
              padding: '10px 20px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
            }}>
              Отмена
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
