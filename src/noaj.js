var N = {
    VERSION: '0.0.1-alpha',
    url: '',
    debug: false,
    connections: [],
    request: function (param) {
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
                if (N.debug)
                    collectCount++;
                i--;
            }
            else if (element.finished) {
                element.old = true;
            }
            if (N.debug)
                totalCount++;
        }
        if (N.debug)
            console.log("[Noaj][GC] Info: Collected: " + collectCount + ", Total: " + totalCount);
        setTimeout(function () { return N.gc(); }, 5000);
    }
};
var Noaj;
(function (Noaj) {
    var Connection = (function () {
        function Connection(url) {
            this.socket = new WebSocket(url.toString());
            this.finished = true;
            this.old = false;
        }
        return Connection;
    }());
    Noaj.Connection = Connection;
    var Request = (function () {
        function Request(param) {
            this.route = param.route;
            this.data = param.data;
            if (param.success != null) {
                this.success = param.success;
            }
            else {
                this.success = function () { };
            }
            this.connection = null;
        }
        Request.prototype.send = function () {
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
                    this.connection = new Noaj.Connection(N.url);
                    N.connections.push(this.connection);
                }
                this.connection.finished = false;
                this.connection.socket.send(JSON.stringify({
                    route: this.route,
                    data: this.data
                }));
                this.connection.socket.onmessage = function (ev) {
                    this.success(ev.data);
                    this.connection.finished = true;
                }.bind(this);
            }
            catch (error) {
                this.fallbackSend();
            }
        };
        Request.prototype.fallbackSend = function () {
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
        };
        return Request;
    }());
    Noaj.Request = Request;
})(Noaj || (Noaj = {}));
var TZW = (function () {
    function TZW() {
    }
    TZW.encode = function (str) {
        var dict = {};
        var data = (str + "").split("");
        var out = [];
        var buffer;
        var res = [];
        var currChar;
        var phrase = data[0];
        var code = 65536;
        for (var i = 1; i < data.length; i++) {
            currChar = data[i];
            if (dict[phrase + currChar] != null) {
                phrase += currChar;
            }
            else {
                out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
                dict[phrase + currChar] = code;
                code++;
                phrase = currChar;
            }
        }
        out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
        buffer = new ArrayBuffer(out.length);
        for (var i = 0; i < out.length; i++) {
            buffer[i] = out[i];
        }
        return buffer;
    };
    TZW.decode = function (str) {
        var dict = {};
        var data = str;
        var currChar = String.fromCharCode(data[0]);
        var oldPhrase = currChar;
        var out = [currChar];
        var res = "";
        var code = 65536;
        var phrase;
        for (var i = 1; i < data.byteLength; i++) {
            var currCode = data[i];
            if (currCode < 65536) {
                phrase = String.fromCharCode(data[i]);
            }
            else {
                phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
            }
            out.push(phrase);
            currChar = phrase.charAt(0);
            dict[code] = oldPhrase + currChar;
            code++;
            oldPhrase = phrase;
        }
        return out.join("");
    };
    return TZW;
}());
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
