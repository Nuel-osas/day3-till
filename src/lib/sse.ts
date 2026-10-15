// GraphQL subscriptions use SSE over POST. EventSource cannot send this body.
export type SubscriptionHandlers<T> = {
  onNext: (data: T) => void | Promise<void>;
  onError?: (errors: unknown) => void;
  onOpen?: () => void;
};
export async function subscribe<T>(url: string, query: string, variables: Record<string, unknown>, handlers: SubscriptionHandlers<T>, signal?: AbortSignal): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
    body: JSON.stringify({ query, variables }), signal,
  });
  if (!res.ok || !res.body) throw new Error(`Subscription HTTP ${res.status}`);
  if (!res.headers.get('content-type')?.includes('text/event-stream')) {
    throw new Error('Expected an event stream');
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = '';
  handlers.onOpen?.();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) return;
      buf = (buf + value).replace(/\r\n/g, '\n');
      let sep: number;
      while ((sep = buf.indexOf('\n\n')) !== -1) {
        const frame = buf.slice(0, sep); buf = buf.slice(sep + 2);
        let event = 'message'; const data: string[] = [];
        for (const line of frame.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
        }
        if (event === 'complete') return;
        if (!data.length) continue;
        const payload = JSON.parse(data.join('\n'));
        if (event === 'error' || payload.errors?.length) {
          handlers.onError?.(payload.errors ?? payload);
          throw new Error(payload.errors?.[0]?.message ?? 'Subscription rejected');
        }
        if (payload.data) await handlers.onNext(payload.data as T);
      }
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
