import type {
  AttemptOutcome,
  AuthResponse,
  DeleteAccountResponse,
  ExerciseType,
  MeResponse,
  PasswordResetRequested,
  PushKeyResponse,
  PushTestResponse,
  QueueResponse,
  SessionCompleteResponse,
  SessionTodayResponse,
  SlotReplaceResponse,
  TranslationsResponse,
  VerseDetailResponse,
  VersesResponse,
} from './types'

const TOKEN_KEY = 'verse-memorize.token'
const USER_KEY = 'verse-memorize.userId'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUserId(): string | null {
  return localStorage.getItem(USER_KEY)
}

export function storeSession(token: string, userId: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, userId)
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function tokenIsExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number }
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(path, {
      method: options.method ?? 'GET',
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError(
      0,
      'Network error — check your connection and try again.',
    )
  }

  const data: unknown = await res.json().catch(() => null)
  const message =
    data &&
    typeof data === 'object' &&
    'error' in data &&
    typeof data.error === 'string'
      ? data.error
      : null

  // A 401 from delete-account means a wrong password, not a dead session.
  const sessionIsDead =
    !path.startsWith('/auth') &&
    path !== '/api/me/delete-account' &&
    (res.status === 401 || message === 'user not found')
  if (sessionIsDead) {
    clearSession()
    onUnauthorized?.()
    throw new ApiError(401, 'Your session has expired. Sign in again.')
  }

  if (!res.ok) {
    throw new ApiError(res.status, message ?? `Request failed (${res.status})`)
  }

  return data as T
}

export const api = {
  signup: (email: string, password: string, timezone: string) =>
    request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: { email, password, timezone },
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  me: () => request<MeResponse>('/api/me'),

  updateProfile: (patch: {
    timezone?: string
    translation?: string
    remindersEnabled?: boolean
  }) => request<MeResponse>('/api/me', { method: 'PATCH', body: patch }),

  forgotPassword: (email: string) =>
    request<PasswordResetRequested>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),

  /** Returns a fresh session, since the reset expires all existing ones. */
  resetPassword: (token: string, password: string) =>
    request<AuthResponse>('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    }),

  requestPasswordReset: () =>
    request<PasswordResetRequested>('/api/me/request-password-reset', {
      method: 'POST',
    }),

  deleteAccount: (password: string) =>
    request<DeleteAccountResponse>('/api/me/delete-account', {
      method: 'POST',
      body: { password },
    }),

  translations: () => request<TranslationsResponse>('/api/translations'),

  /** 503 when the server has no VAPID keys configured. */
  pushKey: () => request<PushKeyResponse>('/api/push/key'),

  pushSubscribe: (subscription: PushSubscriptionJSON) =>
    request<{ subscribed: true }>('/api/push/subscribe', {
      method: 'POST',
      body: subscription,
    }),

  pushUnsubscribe: (endpoint: string) =>
    request<{ subscribed: false }>('/api/push/unsubscribe', {
      method: 'POST',
      body: { endpoint },
    }),

  pushTest: () =>
    request<PushTestResponse>('/api/push/test', { method: 'POST' }),

  sessionToday: (practice = false) =>
    request<SessionTodayResponse>(
      practice ? '/api/session/today?practice=true' : '/api/session/today',
    ),

  attempt: (
    userVerseId: string,
    exerciseType: ExerciseType,
    correct: boolean,
  ) =>
    request<AttemptOutcome>('/api/attempt', {
      method: 'POST',
      body: { userVerseId, exerciseType, correct },
    }),

  sessionComplete: () =>
    request<SessionCompleteResponse>('/api/session/complete', {
      method: 'POST',
    }),

  verses: () => request<VersesResponse>('/api/verses?orderBy=canon'),

  verse: (id: string) =>
    request<VerseDetailResponse>(`/api/verses/${encodeURIComponent(id)}`),

  queue: () => request<QueueResponse>('/api/queue'),

  setQueueOrder: (verseIds: string[]) =>
    request<QueueResponse>('/api/queue', {
      method: 'PUT',
      body: { verseIds },
    }),

  resetQueue: () => request<QueueResponse>('/api/queue', { method: 'DELETE' }),

  moveThemeToTop: (themeId: string) =>
    request<QueueResponse>('/api/queue/theme', {
      method: 'POST',
      body: { themeId },
    }),

  moveVerseToFront: (verseId: string) =>
    request<QueueResponse>('/api/queue/next', {
      method: 'POST',
      body: { verseId },
    }),

  /** The displaced verse keeps its progress and goes next in the queue. */
  replaceSlot: (verseId: string, slot: number) =>
    request<SlotReplaceResponse>('/api/slots/replace', {
      method: 'POST',
      body: { verseId, slot },
    }),
}
