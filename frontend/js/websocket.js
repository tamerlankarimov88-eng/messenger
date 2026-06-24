class NetworkManager {
    constructor(token, onMessage, onOpen) {
        this.token = token;
        this.onMessage = onMessage;
        this.onOpen = onOpen || null;
        this.ws = null;
        this._timer = null;
        this._dead = false;
        this._queue = [];
        this._hbTimer = null;
        this._retryDelay = 1500;
        this._wasConnected = false;
    }
    get isOpen() {
        return this.ws?.readyState === WebSocket.OPEN;
    }
    connect() {
        if (this._dead) return;
        const proto = location.protocol === 'https:' ? 'wss' : 'ws';
        const token = encodeURIComponent(this.token || '');
        try {
            this.ws = new WebSocket(`${proto}://${location.host}/ws/${token}`);
        } catch (e) {
            this._scheduleReconnect();
            return;
        }
        this.ws.onopen = () => {
            console.log('[WS] connected');
            this._retryDelay = 1500;
            this._flushQueue();
            this._startHeartbeat();
            if (this._wasConnected && this.onOpen) this.onOpen(true);
            else if (this.onOpen) this.onOpen(false);
            this._wasConnected = true;
        };
        this.ws.onerror = e => console.warn('[WS] error', e);
        this.ws.onclose = e => {
            this._stopHeartbeat();
            if (this._dead) return;
            this._scheduleReconnect();
        };
        this.ws.onmessage = ev => {
            try {
                const d = JSON.parse(ev.data);
                if (d && d.event === 'pong') return;
                this.onMessage(d);
            } catch (e) { console.warn('[WS] parse err', e); }
        };
    }
    _scheduleReconnect() {
        clearTimeout(this._timer);
        const delay = this._retryDelay;
        this._retryDelay = Math.min(this._retryDelay * 1.6, 15000);
        console.log(`[WS] reconnect in ${Math.round(delay)}ms`);
        this._timer = setTimeout(() => this.connect(), delay);
    }
    _startHeartbeat() {
        this._stopHeartbeat();
        this._hbTimer = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                try { this.ws.send(JSON.stringify({ ping: 1 })); } catch {}
            }
        }, 25000);
    }
    _stopHeartbeat() { if (this._hbTimer) { clearInterval(this._hbTimer); this._hbTimer = null; } }
    _flushQueue() {
        if (!this._queue.length) return;
        const pending = this._queue.splice(0);
        pending.forEach(p => this.send(p));
    }
    send(payload) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            try { this.ws.send(JSON.stringify(payload)); }
            catch (e) { this._queue.push(payload); }
        } else {
            this._queue.push(payload);
            if (!this.ws || this.ws.readyState === WebSocket.CLOSED) this.connect();
        }
    }
    close() {
        this._dead = true;
        clearTimeout(this._timer);
        this._stopHeartbeat();
        this._queue = [];
        this.ws?.close();
    }
}
