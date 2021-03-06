interface IN {
    VERSION: string;
    url: string;
    debug: boolean;
    compression: boolean;
    secured: boolean;
    maxIdle: number;
    maxConnections: number;
    requestQueue: Array<Noaj.Request>;
    requestQueueLock: boolean;
    connections: Array<Noaj.Connection>;
    gc(): void;
    autoGc(): void;
    compressionDetect(): void;
    autoGcInterval: number;
    request(param: Noaj.IRequest): Noaj.Request;
}

var N: IN = {
    VERSION: '0.0.6-alpha',
    url: '',
    debug: false,
    compression: false,
    maxIdle: 1,
    maxConnections: 0, // Leave 0 if there is no limit to max connections.
    requestQueue: [],
    requestQueueLock: false,
    secured: false,
    connections: [],
    request: function (param: Noaj.IRequest) {
        return new Noaj.Request(param);
    },
    gc: function () {
        if (N.debug) {
            var collectCount = 0;
            var totalCount = 0;
        }
        var idle: number = 0;
        for (var i = 0; i < N.connections.length; i++) {
            var element = N.connections[i];
            if (element.old) {
                element.socket.close();
                idle++;
                if (idle > N.maxIdle) {
                    N.connections.splice(i, 1);
                    if (N.debug) collectCount++;
                    i--;
                }
            } else if (element.finished) {
                element.old = true;
            }
            if (N.debug) totalCount++;
        }
        if (N.debug) console.log("[Noaj][GC] Info: Collected: " + collectCount + ", Total: " + totalCount)
        Noaj.Request.sendQueue();
    },
    autoGcInterval: 5000,
    autoGc: function () {
        N.gc();
        setTimeout(() => N.autoGc(), N.autoGcInterval);
    },
    compressionDetect: function () {
        try {
            if (Compression.decode(Compression.encode('hello-world. 你好世界。')) != 'hello-world. 你好世界。') throw "Compression Error";
        } catch (err) {
            if (N.debug) console.log("[Noaj][Compression] Warn: Unable to initialize compression.");
            N.compression = false;
        }
    }
};

module Noaj {
    export class Connection {
        socket: WebSocket;
        finished: boolean;
        old: boolean;
        constructor(url: string) {
            this.socket = new WebSocket((N.secured ? 'wss://' : 'ws://') + url);
            this.finished = true;
            this.old = false;
        }
    }

    export interface IRequest {
        route: string;
        data?: Object;
        success?(data: string): void;
        failure?(): void;
    }

    export class Request {
        route: string;
        data: Object;
        success(data: string): void { }
        connection: Connection;

        constructor(param: IRequest) {
            this.route = param.route;
            this.data = param.data;
            if (param.success != null) {
                this.success = param.success;
            }
            this.connection = null;
        }

        send(): boolean {
            try {
                for (var key in N.connections) {
                    var element = N.connections[key];
                    if (element.finished) {
                        this.connection = element;
                        this.connection.old = false;
                        break;
                    }
                }
                if (this.connection === null) {
                    if (!N.connections && N.connections.length >= N.maxConnections) {
                        N.requestQueue.push(this);
                    } else {
                        this.connection = new Noaj.Connection(N.url)
                        N.connections.push(this.connection);
                    }
                }
                this.connection.finished = false;

                try {
                    if (!N.compression) throw "Compression not enable";
                    var compressed: ArrayBuffer = Compression.encode(JSON.stringify({
                        route: this.route,
                        data: this.data
                    }));
                    this.connection.socket.send(compressed);
                    this.connection.socket.onmessage = function (ev: MessageEvent) {
                        if (typeof ev.data === "string") {
                            this.success(ev.data);
                        } else {
                            this.success(Compression.decode(ev.data));
                        }
                        this.connection.finished = true;
                    }.bind(this);
                } catch (err) {
                    // Fallback to uncompressed data
                    this.connection.socket.send(JSON.stringify({
                        route: this.route,
                        data: this.data
                    }));
                    this.connection.socket.onmessage = function (ev: MessageEvent) {
                        if (typeof ev.data === "string") {
                            this.success(ev.data);
                            Noaj.Request.sendQueue();
                        } else {
                            this.success(Compression.decode(ev.data));
                            Noaj.Request.sendQueue();
                        }
                        this.connection.finished = true;
                    }.bind(this);
                }

                this.connection.socket.onclose = function () {
                    this.connection.finished = true;
                    if (N.debug) console.log("[Noaj][WebSocket] Error: WebSocket closed unexpectedly.");
                    Noaj.Request.sendQueue();
                }.bind(this);
                this.connection.socket.onerror = function () {
                    this.connection.finished = true;
                    if (N.debug) console.log("[Noaj][WebSocket] Error: WebSocket has met an unexpected problem.");
                    Noaj.Request.sendQueue();
                }
                return true;
            } catch (error) {
                if (N.debug) console.log("[Noaj][WebSocket] Error: Unable to proceed with WebSocket, falling back to AJAX. " + error)
                this.fallbackSend();
                return false;
            }
        }

        static sendQueue() {
            if (N.requestQueueLock) return;
            if (N.maxConnections != 0) {
                N.requestQueueLock = true;
                var queueLength = N.requestQueue.length;
                for (var i = 0; i < queueLength; i++) {
                    var e = N.requestQueue[i];
                    e.send();
                    N.requestQueue.shift();
                    queueLength--;
                    i--;
                }
                N.requestQueueLock = false;
            }
        }

        fallbackSend() {
            try {
                var ajaxRequest = new XMLHttpRequest();
                ajaxRequest.open('POST', (N.secured ? 'https://' : 'http://') + N.url, true);
                ajaxRequest.send(JSON.stringify({
                    route: this.route,
                    data: this.data
                }));
                ajaxRequest.onreadystatechange = function () {
                    if (ajaxRequest.readyState === 4 &&
                        ajaxRequest.status === 200) {
                        this.success(ajaxRequest.responseText);
                    } else if (ajaxRequest.readyState === 4) {
                        if (N.debug) console.log("[Noaj][AJAX] Error: AJAX has returned with an unsuccessful result.")
                    }
                }.bind(this);
            } catch (err) {
                if (N.debug) console.log("[Noaj][AJAX] Error: AJAX has met a problem.")
            }
        }
    }
}

class Compression {
    static dictSize: number = 65535;

    static encode(str: string): ArrayBuffer {
        var dict: Object = {};
        var data: Array<string> = (str + "").split("");
        var out: Array<number> = [];
        var buffer: ArrayBuffer;
        var currChar: string;
        var phrase: string = data[0];
        var code: number = Compression.dictSize;
        for (var i = 1; i < data.length; i++) {
            currChar = data[i];
            if (currChar.charCodeAt(0) > Compression.dictSize) throw "Compression Source Out of Range";
            if (dict['_' + phrase + currChar] != null) {
                phrase += currChar;
            } else {
                out.push(phrase.length > 1 ? dict['_' + phrase] : phrase.charCodeAt(0));
                dict['_' + phrase + currChar] = code;
                code++;
                phrase = currChar;
            }
        }
        out.push(phrase.length > 1 ? dict['_' + phrase] : phrase.charCodeAt(0));
        buffer = new ArrayBuffer(out.length);
        for (var i = 0; i < out.length; i++) {
            buffer[i] = out[i];
        }
        return buffer;
    }
    static decode(str: ArrayBuffer): string {
        var dict: Object = {};
        var data: ArrayBuffer = str;
        var currChar: string = String.fromCharCode(data[0]);
        var oldPhrase: string = currChar;
        var out: Array<string> = [currChar];
        var code: number = Compression.dictSize;
        var phrase: string;
        for (var i = 1; i < data.byteLength; i++) {
            var currCode: number = data[i];
            if (currCode < Compression.dictSize) {
                phrase = String.fromCharCode(data[i]);
            }
            else {
                phrase = dict['_' + currCode] ? dict['_' + currCode] : (oldPhrase + currChar);
            }
            out.push(phrase);
            currChar = phrase.charAt(0);
            dict['_' + code] = oldPhrase + currChar;
            code++;
            oldPhrase = phrase;
        }
        return out.join("");
    }

    static getUtfSize(str: string): number {
        var sizeInBytes = str.split('')
            .map(function (ch) {
                return ch.charCodeAt(0);
            }).map(function (uchar) {
                return uchar < 128 ? 1 : 2;
            }).reduce(function (curr, next) {
                return curr + next;
            });
        return sizeInBytes;
    }

    static benchmark(str: string): number {
        console.log("[Noaj][Compression] Info: Compression Rate " + ((Compression.encode(str).byteLength / Compression.getUtfSize(str)) * 100) + " %");
        return Compression.encode(str).byteLength / Compression.getUtfSize(str);
    }
}
N.autoGc();
N.compressionDetect();