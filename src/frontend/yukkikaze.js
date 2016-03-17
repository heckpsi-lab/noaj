var Ykk = {
    ajaxSockets: [],
    ajax: function(param){
        return new this.Ajax(param, this.ajaxSockets);
    },
    realtime: function(param){
        return new this.RealTime(param);
    }
};

Ykk.Ajax  = (function (){
    function Ajax(param, sockets) {
        this.url = param.url;
        this.api = param.api;
        this.data = param.data;
        this.success = param.success;
        this.failure = param.failure;
        this.sockets = sockets;
    }
    Ajax.prototype.send = function() {

    }
}());

Ykk.RealTime = (function (){
    function RealTime(param) {
        this.url = param.url;
        this.data = param.data;
        this.event = param.event;
        this.isBusy = function(){
            return (this.socket.bufferedAmount > 0);
        }
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