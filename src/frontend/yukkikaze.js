WebSocket.prototype.isSending = function(){
    return (this.bufferedAmount > 0);
};

WebSocket.prototype.isReceiving = false;

var Ykk = {
    ajaxSockets: [],
    ajaxUrl: '',
    ajax: function(param){
        return new this.Ajax(param);
    },
    realtime: function(param){
        return new this.RealTime(param);
    }
};

Ykk.Ajax  = (function (){
    function Ajax(param) {
        this.api = param.api;
        this.data = param.data;
        this.success = param.success;
        this.failure = param.failure;
    }

    Ajax.prototype.send = function(param) {
        var freeSocket = null;
        for (var i in Ykk.ajaxSockets){
            if (Ykk.ajaxSockets[i].bufferedAmount == 0 && !Ykk.ajaxSockets[i].isReceiving){
                freeSocket = Ykk.ajaxSockets[i];
                break;
            }
        }
        if (freeSocket == null){
            freeSocket = new WebSocket(Ykk.ajaxUrl);
            Ykk.ajaxSockets.push(freeSocket);
        }
        freeSocket.send(JSON.stringify({api: param.api, data: param.data}));
        freeSocket.isReceiving = true;
        freeSocket.onmessage = function(event){
            this.success(event.data);
            if (Ykk.ajaxSockets.length > 1){
                freeSocket.close();
                Ykk.ajaxSockets.splice(Ykk.ajaxSockets.indexOf(freeSocket), 1);
            }
        }
    }
}());

Ykk.RealTime = (function (){
    function RealTime(param) {
        this.url = param.url;
        this.data = param.data;
        this.event = param.event;
    }

    RealTime.prototype.start = function() {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = function(ws){
            ws.send(JSON.stringify(this.data));
        };

        this.socket.onmessage = function(event){
            var data = JSON.parse(event.data);
            for (var e in this.event){
                if (e == data.event){
                    this.event[e](data.data);
                    break;
                }
            }
        }
    };

    RealTime.prototype.send = function(data){
        this.socket.send(JSON.stringify(data));
    };

    RealTime.prototype.stop = function(){
        this.socket.close();
    };
}());