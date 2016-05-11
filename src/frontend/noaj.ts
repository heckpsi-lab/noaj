interface IN {
    url: String;
    debug: Boolean;
    connections: Array<Noaj.Connection>;
    gc: Function;
    request(param: Noaj.IRequest): Noaj.Request;
}

var N: IN = {
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

N.gc();

/*
N.request({
    route: 'test'
}).send();

N.request({
    route: 'hello', 
    data: {foo: 'bar'}
    success: function(data: string){
        console.log(data);
}}).send();
*/