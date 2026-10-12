// GraphQL subscriptions on Sui are Server-Sent Events over HTTP POST.
// EventSource can only GET, so we POST with fetch and parse the stream by hand.
// This file has no DOM or Node dependencies: the browser Till and the Node indexer share it.

export type SubscriptionHandlers<T> = {
  onNext: (data: T) => void | Promise<void>;
  onError?: (errors: unknown) => void;
  onOpen?: () => void;
};

export async function subscribe<T>(
  url: string,
  query: string,
  variables: Record<string, unknown>,
  handlers: SubscriptionHandlers<T>,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
    body: JSON.stringify({ query, variables }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`subscription HTTP ${res.status}`);
  handlers.onOpen?.();

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) return; // server closed the stream: caller reconnects with its last cursor
    buf += value;
    // SSE frames are separated by a blank line. Normalise CRLF first.
    buf = buf.replace(/\r\n/g, '\n');
    let sep: number;
    while ((sep = buf.indexOf('\n\n')) !== -1) {
      const frame = buf.slice(0, sep);
      buf = buf.slice(sep + 2);
      let event = 'message';
      const data: string[] = [];
      for (const line of frame.split('\n')) {
        if (line.startsWith(':')) continue; // keep-alive comment
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
      }
      if (!data.length) continue;
      if (event === 'complete') return;
      const payload = JSON.parse(data.join('\n'));
      if (payload.errors?.length) {
        handlers.onError?.(payload.errors);
        continue;
      }
      if (payload.data) await handlers.onNext(payload.data as T);
    }
  }
}
