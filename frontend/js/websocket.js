class NetworkManager {
    constructor(token, onMessage) {
        this.token = token;
        this.onMessage = onMessage;
        this.ws = null;
        this._timer = null;
        this._dead = false;
    }
    connect() {
        if (this._dead) return;
        // Auto-protocol: wss:// на https (Render), ws:// локально
        const proto = location.protocol === 'https:' ? 'wss' : 'ws';
        this.ws = new WebSocket(`${proto}://${location.host}/ws/${this.token}`);
        this.ws.onopen  = () => console.log('[WS] connected');
        this.ws.onerror = e  => console.warn('[WS] error', e);
        this.ws.onclose = e  => {
            if (this._dead) return;
            console.log(`[WS] closed (${e.code}), retry 3s`);
            this._timer = setTimeout(() => this.connect(), 3000);
        };
        this.ws.onmessage = ev => {
            try { this.onMessage(JSON.parse(ev.data)); }
            catch(e) { console.warn('[WS] parse err', e); }
        };
    }
    send(payload) {
        if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(payload));
        else console.warn('[WS] not open');
    }
    close() { this._dead = true; clearTimeout(this._timer); this.ws?.close(); }
}
