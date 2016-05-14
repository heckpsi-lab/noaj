interface IN {
    VERSION: string;
    url: string;
    debug: boolean;
    compression: boolean;
    secured: boolean;
    maxIdle: number;
    connections: Array<Noaj.Connection>;
    gc(): void;
    autoGc(): void;
    autoGcInterval: number;
    request(param: Noaj.IRequest): Noaj.Request;
}

var N: IN = {
    VERSION: '0.0.5-beta',
    url: '',
    debug: false,
    compression: false,
    maxIdle: 1,
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
    },
    autoGcInterval: 5000,
    autoGc: function () {
        N.gc();
        setTimeout(() => N.autoGc(), N.autoGcInterval);
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
                if (this.connection == null) {
                    this.connection = new Noaj.Connection(N.url)
                    N.connections.push(this.connection);
                }
                this.connection.finished = false;
                if (N.compression) {
                    this.connection.socket.send(Compression.encode(JSON.stringify({
                        route: this.route,
                        data: this.data
                    })));
                    this.connection.socket.onmessage = function (ev: MessageEvent) {
                        this.success(Compression.decode(ev.data));
                        this.connection.finished = true;
                    }.bind(this);
                    this.connection.socket.onclose = function () {
                        this.connection.finished = true;
                        if (N.debug) console.log("[Noaj][WebSocket] Error: WebSocket closed unexpectedly.");
                    }.bind(this);
                    this.connection.socket.onerror = function () {
                        this.connection.finished = true;
                        if (N.debug) console.log("[Noaj][WebSocket] Error: WebSocket has met an unexpected problem.");
                    }
                } else {
                    this.connection.socket.send(JSON.stringify({
                        route: this.route,
                        data: this.data
                    }));
                    this.connection.socket.onmessage = function (ev: MessageEvent) {
                        this.success(ev.data);
                        this.connection.finished = true;
                    }.bind(this);
                }
                return true;
            } catch (error) {
                if (N.debug) console.log("[Noaj][WebSocket] Error: Unable to proceed with WebSocket, falling back to AJAX. " + error)
                this.fallbackSend();
                return false;
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
                    if (ajaxRequest.readyState == 4 &&
                        ajaxRequest.status == 200) {
                        this.success(ajaxRequest.responseText);
                    } else if (ajaxRequest.readyState == 4) {
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
    static benchmark(str: string): number {
        console.log("[Noaj][Compression] Info: Compression Rate " + ((Compression.encode(str).byteLength / str.length) * 100) + " %");
        return Compression.encode(str).byteLength / str.length;
    }
}
N.autoGc();