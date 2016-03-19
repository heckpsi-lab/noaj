WebSocket.prototype.hasFinished = true;
WebSocket.prototype.isOldObject = false;

var Ykk = {
    debug: false,
    ajaxSockets: [],
    ajaxUrl: '',
    Classes: {},
    ajax: function(param){
        return (new Ykk.Classes.Ajax(param));
    },
    realtime: function(param){
        return (new Ykk.Classes.RealTime(param));
    },
    gc: function(){
        if(Ykk.debug){var collect_count = 0; var total_count = 0;}
        for (var i = 0; i < this.ajaxSockets.length; i++){
            if (this.ajaxSockets[i].isOldObject){
                this.ajaxSockets[i].close();
                this.ajaxSockets.splice(i, 1);
                if(Ykk.debug){collect_count++;}
                i--;
            } else if (this.ajaxSockets[i].hasFinished){
                this.isOldObject(true);
            }
            if(Ykk.debug){total_count++;}
        }
        if(Ykk.debug){console.log("[Yukkikaze.js][GC]Info: Collected:" + collect_count + " Total:"+ total_count)}
        setTimeout("Ykk.gc()", 5000);
    }
};

Ykk.gc();

Ykk.Classes.Ajax  = (function (){
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

        this.socket.hasFinished = false;
        this.socket.send(JSON.stringify({api: param.api, data: param.data}));
        this.socket.onmessage = function(event){
            this.parent.success(event.data);
            this.parent.socket.hasFinished = true;
        }
    };

    return Ajax;
}());

Ykk.Classes.RealTime = (function (){
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

    return RealTime;
}());