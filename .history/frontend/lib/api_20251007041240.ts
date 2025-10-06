export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';



export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';



export async function apiFetch<T>(

    path: string,

    options: {

        method?: HttpMethod;

        token?: string | null;

        body?: unknown;

        headers?: Record<string, string>;

    } = {}

): Promise<T> {

    const { method = 'GET', token, body, headers = {} } = options;

    const res = await fetch(`${API_BASE}${path}`, {

        method,

        headers: {

            'Content-Type': 'application/json',

            ...(token ? { Authorization: `Bearer ${token}` } : {}),

            ...headers,

        },

        body: body ? JSON.stringify(body) : undefined,

        cache: 'no-store',

    });

    if (!res.ok) {

        let message = `Request failed (${res.status})`;

        try {

            const data = await res.json();

            if (data && data.message) message = data.message;

        } catch (_) {}

        throw new Error(message);

    }

    return (await res.json()) as T;

}


export async function streamFetch(
  path: string,
  {
    token,
    body,
    onChunk,
    onDone,
    onError,
  }: {
    token?: string | null;
    body?: unknown;
    onChunk: (chunk: string) => void;
    onDone?: () => void;
    onError?: (err: unknown) => void;
  }
) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) throw new Error('Streaming failed');

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) onChunk(line);
      }
    }

    onDone?.();
  } catch (err) {
    console.error(err);
    onError?.(err);
  }
}

export const AuthAPI = {

    register: (email: string, password: string) =>

        apiFetch<{ _id: string; email: string; token: string }>(`/api/auth/register`, {

            method: 'POST',

            body: { email, password },

        }),

    login: (email: string, password: string) =>

        apiFetch<{ _id: string; email: string; token: string }>(`/api/auth/login`, {

            method: 'POST',

            body: { email, password },

        }),

};



export type Chat = { _id: string; userId: string; title: string; updatedAt: string };

export type Message = { _id: string; chatId: string; userId: string; role: 'user' | 'ai'; content: string; createdAt: string };



export const ChatAPI = {
    createChat: (token: string) =>
        apiFetch<Chat>(`/api/chats`, { method: 'POST', token }),

    listChats: (token: string) =>
        apiFetch<Chat[]>(`/api/chats`, { token }),

    getMessages: (token: string, chatId: string) =>
        apiFetch<Message[]>(`/api/chats/${chatId}/messages`, { token }),

    sendMessage: (token: string, chatId: string, content: string) =>
        apiFetch<{ userMessage: Message; message: string }>(
            `/api/chats/${chatId}/send`,
            {
                method: 'POST',
                token,
                body: { content },
            }
        ),

    // 👇 NEW STREAMING METHOD
    streamMessage: (
        token: string,
        chatId: string,
        content: string,
        onChunk: (chunk: string) => void,
        onDone?: () => void,
        onError?: (err: unknown) => void
    ) =>
        streamFetch(`/api/chats/${chatId}/stream`, {
            token,
            body: { content },
            onChunk,
            onDone,
            onError,
        }),
};
