var N = {
    VERSION: '0.0.4-alpha',
    url: '',
    debug: false,
    compression: false,
    secured: false,
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
    },
    autoGcInterval: 5000,
    autoGc: function () {
        N.gc();
        setTimeout(function () { return N.autoGc(); }, N.autoGcInterval);
    }
};
var Noaj;
(function (Noaj) {
    var Connection = (function () {
        function Connection(url) {
            this.socket = new WebSocket((N.secured ? 'wss://' : 'ws://') + url);
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
            this.connection = null;
        }
        Request.prototype.success = function (data) { };
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
                if (N.compression) {
                    this.connection.socket.send(Compression.encode(JSON.stringify({
                        route: this.route,
                        data: this.data
                    })));
                    this.connection.socket.onmessage = function (ev) {
                        this.success(Compression.decode(ev.data));
                        this.connection.finished = true;
                    }.bind(this);
                }
                else {
                    this.connection.socket.send(JSON.stringify({
                        route: this.route,
                        data: this.data
                    }));
                    this.connection.socket.onmessage = function (ev) {
                        this.success(ev.data);
                        this.connection.finished = true;
                    }.bind(this);
                }
                return true;
            }
            catch (error) {
                if (N.debug)
                    console.log("[Noaj][WebSocket] Error: Unable to proceed with WebSocket, falling back to AJAX. " + error);
                this.fallbackSend();
                return false;
            }
        };
        Request.prototype.fallbackSend = function () {
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
                }
            }.bind(this);
        };
        return Request;
    }());
    Noaj.Request = Request;
})(Noaj || (Noaj = {}));
var Compression = (function () {
    function Compression() {
    }
    Compression.encode = function (str) {
        var dict = {};
        var data = (str + "").split("");
        var out = [];
        var buffer;
        var currChar;
        var phrase = data[0];
        var code = Compression.dictSize;
        for (var i = 1; i < data.length; i++) {
            currChar = data[i];
            if (dict['_' + phrase + currChar] != null) {
                phrase += currChar;
            }
            else {
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
    };
    Compression.decode = function (str) {
        var dict = {};
        var data = str;
        var currChar = String.fromCharCode(data[0]);
        var oldPhrase = currChar;
        var out = [currChar];
        var code = Compression.dictSize;
        var phrase;
        for (var i = 1; i < data.byteLength; i++) {
            var currCode = data[i];
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
    };
    Compression.benchmark = function (str) {
        console.log("[Noaj][Compression] Info: Compression Rate " + ((Compression.encode(str).byteLength / str.length) * 100) + " %");
        return Compression.encode(str).byteLength / str.length;
    };
    Compression.dictSize = 65535;
    return Compression;
}());
N.autoGc();
