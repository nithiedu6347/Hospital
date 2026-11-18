const keyFor = (role) => `athma_${role}`
const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export function apiUrl(path) {
  return `${apiBase}${path}`
}

export function saveSession(role, session) {
  sessionStorage.setItem(keyFor(role), JSON.stringify(session))
}

export function readSession(role) {
  const raw = sessionStorage.getItem(keyFor(role))
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearSession(role) {
  sessionStorage.removeItem(keyFor(role))
}

export async function postJson(url, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(apiUrl(url), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = data.detail
    throw new Error(typeof detail === 'string' ? detail : 'Check the form and try again.')
  }
  return data
}

export async function getJson(url, token) {
  const response = await fetch(apiUrl(url), {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = data.detail
    const error = new Error(typeof detail === 'string' ? detail : 'Request failed')
    error.status = response.status
    throw error
  }
  return data
}
