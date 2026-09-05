import { useState, useEffect } from 'react'
import { sha256 } from "js-sha256"
import { useAuth } from '../hooks/useAuth'

const API_URL = ''

function generateCodeVerifier(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  for (let i = 0; i < 128; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generateCodeChallenge(verifier: string): string {
  const hash = sha256(verifier)
  const bytes = new Uint8Array(hash.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function Login() {
  const { login, register } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [loginInput, setLoginInput] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [vkConfig, setVkConfig] = useState<{ appId: number; redirectUri: string } | null>(null)
  const [vkLoading, setVkLoading] = useState(false)
  const [showSoundPrompt, setShowSoundPrompt] = useState(false)
  const [pendingRedirect, setPendingRedirect] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/api/vk/config`)
      .then(r => r.json())
      .then(data => {
        if (data.appId) setVkConfig(data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const device_id = params.get('device_id')
    const state = params.get('state')
    if (code && device_id && state) {
      const codeVerifier = localStorage.getItem('vk_code_verifier')
      if (!codeVerifier) {
        setError('PKCE code verifier not found. Please try again.')
        window.history.replaceState({}, document.title, window.location.pathname)
        return
      }
      setVkLoading(true)
      setError('')
      fetch(`${API_URL}/api/vk/id-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, device_id, state, code_verifier: codeVerifier }),
      })
        .then(r => r.json())
        .then(result => {
          if (result.error) {
            setError(result.error)
            setVkLoading(false)
            return
          }
          localStorage.setItem('token', result.token)
          localStorage.removeItem('vk_code_verifier')
          localStorage.removeItem('vk_state')
          localStorage.removeItem('vk_device_id')
          // Показать запрос на звук после VK авторизации
          setShowSoundPrompt(true)
          setPendingRedirect(true)
        })
        .catch(err => {
          setError(err.message || 'VK auth error')
          setVkLoading(false)
        })
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const vkError = params.get('vk_error')
    if (vkError) {
      const messages: Record<string, string> = {
        missing_params: 'Missing params from VK ID',
        token_error: 'Token exchange error',
        no_token: 'VK ID did not return token',
        user_info_error: 'Failed to get user info from VK',
        server_error: 'Server error during VK auth',
        pkce_required: 'PKCE required. Use frontend redirect.',
      }
      setError(messages[vkError] || `VK error: ${vkError}`)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (isRegister) {
        await register(loginInput, password, name, username || undefined)
      } else {
        await login(loginInput, password)
      }
      // После успешного входа показываем запрос на разрешение звуков
      setShowSoundPrompt(true)
      setPendingRedirect(true)
    } catch (err: any) {
      setError(err.message || 'Auth error')
    }
  }

  const enableSound = async () => {
    // Разблокировать AudioContext через user gesture
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContext) {
        const ctx = new AudioContext()
        if (ctx.state === 'suspended') {
          await ctx.resume()
        }
        // Воспроизвести тихий звук для разблокировки
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        gain.gain.value = 0.001
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.01)
      }
    } catch (e) {
      // ignore
    }
    localStorage.setItem('soundEnabled', 'true')
    window.location.href = '/'
  }

  const disableSound = () => {
    localStorage.setItem('soundEnabled', 'false')
    window.location.href = '/'
  }

  const handleVKLogin = async () => {
    if (!vkConfig) {
      setError('VK ID not configured')
      return
    }
    setVkLoading(true)
    setError('')
    const state = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)
    const deviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    localStorage.setItem('vk_state', state)
    localStorage.setItem('vk_device_id', deviceId)
    localStorage.setItem('vk_code_verifier', codeVerifier)
    const params = new URLSearchParams({
      client_id: vkConfig.appId.toString(),
      redirect_uri: vkConfig.redirectUri,
      response_type: 'code',
      state,
      device_id: deviceId,
      scope: 'email',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })
    window.location.href = `https://id.vk.ru/authorize?${params.toString()}`
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid #e0e0e0',
    fontSize: 14,
    outline: 'none',
    width: '100%',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-body)', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400, padding: 32, background: 'var(--bg-card)', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>WeCRM</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 24 }}>{isRegister ? 'Создать аккаунт' : 'Вход'}</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isRegister && (
            <>
              <input type="text" placeholder="Имя" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
              <input type="text" placeholder="Логин (необязательно)" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} />
            </>
          )}
          <input
            type="text"
            placeholder={isRegister ? 'Email' : 'Email или логин'}
            value={loginInput}
            onChange={e => setLoginInput(e.target.value)}
            required
            style={inputStyle}
          />
          <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
          {error && (
            <div style={{ color: '#dc2626', fontSize: 13 }}>{error}</div>
          )}
          <button type="submit" style={{ padding: '12px', borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>{isRegister ? 'Зарегистрироваться' : 'Войти'}</button>
        </form>
        <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>или</span>
          <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
        </div>
        {vkConfig ? (
          <button onClick={handleVKLogin} disabled={vkLoading} style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: '#0077ff', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: vkLoading ? 0.6 : 1 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.57 4 8.098c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.814-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/></svg>
            {vkLoading ? 'Перенаправление...' : 'Войти через VK'}
          </button>
        ) : (
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>VK ID не настроен</div>
        )}
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 16 }}>
          {isRegister ? (
            <>Уже есть аккаунт? <button onClick={() => setIsRegister(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>Войти</button></>
          ) : (
            <>Нет аккаунта? <button onClick={() => setIsRegister(true)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>Регистрация</button></>
          )}
        </p>
      </div>

      {/* Модальное окно запроса разрешения на звуки */}
      {showSoundPrompt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: 'max(16px, env(safe-area-inset-top, 0)) max(16px, env(safe-area-inset-right, 0)) max(16px, env(safe-area-inset-bottom, 0)) max(16px, env(safe-area-inset-left, 0))',
        }}>
          <div style={{
            width: '100%',
            maxWidth: 360,
            padding: 28,
            background: 'var(--bg-card)',
            borderRadius: 20,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
              Звуковые уведомления
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
              Разрешить воспроизведение звуков при новых сообщениях, задачах и появлении пользователей онлайн?
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={enableSound}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Разрешить
              </button>
              <button
                onClick={disableSound}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Пропустить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
