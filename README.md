# NOJA

## What is NOJA
NOJA (Not Only Asynchronous JavaScript) is a communication framework which provides AJAX-like API based on WebSocket. It could dynamically manage the socket pool to reduce the redundant package headers. It could also fallback to AJAX if the browser does not support WebSocket feature.

## Developing Status

Front-end framework:

TypeScript: No release yet

JavaScript: No release yet



Back-end framework:

Ruby (for sinatra): No release yet

Ruby (for Rails): No release yet

## Getting Started

```javascript
N.url = 'http://foo.bar/noja'

N.request({
    route: '/hello'
}).send();

N.request({
    route: 'hello',
    data: {foo: 'bar'}
    success: function(data){
        console.log(data);
}}).send();
```
