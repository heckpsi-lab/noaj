# Yukkikaze.js

## What is Yukkikaze.js
Yukkikaze.js is a protocol and framework building on WebSocket, providing realtime listener and low cost ajax-like request on front-end browsers.

Yukkikaze.js provides a set of APIs to build its own protocol on the WebSocket, making it easy to use. For developing realtime app, yukkikaze.js would provide event listener on specific event you defined, and it would be run on a separate connection to keep the realtime efficiency. It also provides ajax-like request APIs to deal with asynchronous requests. It would manage the connection numbers itself to reduce the packages' size and the connection times to the server, releasing the cost of the servers than traditional ajax.

## Developing Status

Front-end framework:

Alpha: No release

Beta: No release

Release: No release



Back-end framework:

Ruby (for sinatra): [![Gem Version](https://badge.fury.io/rb/sinatra-yukkikaze.svg)](https://badge.fury.io/rb/sinatra-yukkikaze)

Ruby (for Rails): No release

Node.js (for express.js): No release

C++(for safaia-framework): No release

Go(for Martini): No release

## Getting Started

```javascript
Ykk.ajaxUrl = "http://foo.com/yukkikaze-ajax";
Ykk.ajax({
  'api': '/hello-world',
  'data': {'foo': 'bar'}
  'success': function(data){
    alert(data);
  },
  'failure': function(code, data){
    alert(code);
    alert(data);
  }
}).send();
```

```javascript
chat = Ykk.realtime({
  'url': 'http://foo.com/chat-room',
  'data': {'foo': 'bar'},
  'event': {
    'foo': function(data){alert('foo: ' + data)},
    'bar': function(data){alert('bar: ' + data)}
   }
}).start();
chat.send({
  'type': 'send-msg',
  'data': {'msg': 'hello'}
});
```