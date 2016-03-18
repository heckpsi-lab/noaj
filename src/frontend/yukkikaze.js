WebSocket.prototype.hasFinished = true;
WebSocket.prototype.isOldObject = false;

var Ykk = {
    ajaxSockets: [],
    ajaxUrl: '',
    ajax: function(param){
        return new this.Ajax(param);
    },
    realtime: function(param){
        return new this.RealTime(param);
    },
    gc: function(){
        for (var i = 0; i < this.ajaxSockets.length; i++){
            if (this.ajaxSockets[i].isOldObject){
                this.ajaxSockets[i].close();
                this.ajaxSockets.splice(i, 1);
                i--;
            } else if (this.ajaxSockets[i].hasFinished){
                this.isOldObject(true)
            }
        }
        setTimeout(Ykk.gc(), 5000);
    }
};

Ykk.gc();

Ykk.Ajax  = (function (){
    function Ajax(param) {
        this.api = param.api;
        this.data = param.data;
        this.success = param.success;
        this.failure = param.failure;
        this.socket = null;
    }

    Ajax.prototype.send = function(param) {
        for (var i in Ykk.ajaxSockets){
            if (!Ykk.ajaxSockets[i].hasFinished){
                this.socket = Ykk.ajaxSockets[i];
                this.socket.isOldObject = false;
                break;
            }
        }
        if (this.socket == null){
            this.socket = new WebSocket(Ykk.ajaxUrl);
            Ykk.ajaxSockets.push(this.socket);
        }
        this.socket.send(JSON.stringify({api: param.api, data: param.data}));
        this.socket.onmessage = function(event){
            this.parent.success(event.data);
            this.parent.socket.hasFinished = false;
            if (Ykk.ajaxSockets.length > 1){
                this.parent.socket.close();
                Ykk.ajaxSockets.splice(Ykk.ajaxSockets.indexOf(this.parent.socket), 1);
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
            for (var e in this.parent.event){
                if (e == data.event){
                    this.parent.event[e](data.data);
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