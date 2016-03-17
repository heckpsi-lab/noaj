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
    }

    RealTime.prototype.start = function() {

    };
}());