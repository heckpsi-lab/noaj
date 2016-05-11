interface IN {
    VERSION: String;
    url: String;
    debug: Boolean;
    connections: Array<Noaj.Connection>;
    gc: Function;
    request(param: Noaj.IRequest): Noaj.Request;
}

var N: IN = {
    VERSION: '0.0.1-alpha',
    url: '',
    debug: false,
    connections: [],
    request: function (param: Noaj.IRequest) {
        return new Noaj.Request(param);
    },
    gc: function () {
        if (N.debug) {
            var collectCount = 0;
            var totalCount = 0;
        }
        for (var i = 0; i < N.connections.length; i++) {
            var element = N.connections[i];
            if (element.old) {
                element.socket.close();
                N.connections.splice(i, 1);
                if (N.debug) collectCount++;
                i--;
            } else if (element.finished) {
                element.old = true;
            }
            if (N.debug) totalCount++;
        }
        if (N.debug) console.log("[Noaj][GC] Info: Collected: " + collectCount + ", Total: " + totalCount)
        setTimeout(() => N.gc(), 5000);
    }
}

module Noaj {
    export class Connection {
        socket: WebSocket;
        finished: Boolean;
        old: Boolean;
        constructor(url: String) {
            this.socket = new WebSocket(url.toString());
            this.finished = true;
            this.old = false;
        }
    }

    export interface IRequest {
        route: String;
        data?: Object;
        success?: Function;
        failure?: Function;
    }

    export class Request {
        route: String;
        data: Object;
        success: Function;
        connection: Connection;

        constructor(param: IRequest) {
            this.route = param.route;
            this.data = param.data;
            if (param.success != null) {
                this.success = param.success;
            } else {
                this.success = function () { };
            }
            this.connection = null;
        }

        send() {
            try {
                for (var key in N.connections) {
                    var element = N.connections[key];
                    if (!element.finished) {
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
                this.connection.socket.send(JSON.stringify({
                    route: this.route,
                    data: this.data
                }));
                this.connection.socket.onmessage = function (ev: MessageEvent) {
                    this.success(ev.data);
                    this.connection.finished = true;
                }.bind(this);
            } catch (error) {
                this.fallbackSend();
            }
        }

        fallbackSend() {
            var ajaxRequest = new XMLHttpRequest();
            ajaxRequest.open('POST', N.url.toString(), true);
            ajaxRequest.send(JSON.stringify({
                route: this.route,
                data: this.data
            }));
            ajaxRequest.onreadystatechange = function () {
                if (ajaxRequest.readyState == 4 &&
                    ajaxRequest.status == 200) {
                    this.success(ajaxRequest.responseText);
                }
            }.bind(this);
        }
    }
}

class LZW {
    static dictSize:number = 57344;
    
    static encode(str: string):ArrayBuffer {
        var dict:Object = {};
        var data:Array<string> = (str + "").split("");
        var out:Array<number> = [];
        var buffer:ArrayBuffer;
        var res:Array<string> = [];
        var currChar:string;
        var phrase:string = data[0];
        var code:number = LZW.dictSize;
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
        for (var i = 0; i < out.length; i++){
            buffer[i] = out[i];
        }
        return buffer;
    }
    static decode(str: ArrayBuffer):string {
        var dict:Object = {};
        var data:ArrayBuffer = str;
        var currChar:string = String.fromCharCode(data[0]);
        var oldPhrase:string = currChar;
        var out:Array<string> = [currChar];
        var res:string = "";
        var code:number = LZW.dictSize;
        var phrase:string;
        for (var i = 1; i < data.byteLength; i++) {
            var currCode:number = data[i];
            if (currCode < LZW.dictSize) {
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
}

N.gc();

/*
N.request({
    route: 'test'
}).send();

N.request({
    route: '/hello', 
    data: {foo: 'bar'}
    success: function(data: string){
        console.log(data);
}}).send();
*/