# NOAJ

## What is NOAJ
NOAJ (Not Only Asynchronous JavaScript, formerly called [yukkikaze.js](https://github.com/dsh0416/yukkikaze.js)) is a communication framework which provides AJAX-like API based on WebSocket. It could dynamically manage the socket pool to reduce the redundant package headers. It could also fallback to AJAX if the browser does not support WebSocket feature.

## Versions

### Front-end

|                |    Alpha    | Beta | Release |
| -------------- | :---------: | :--: | :-----: |
| TypeScript     | 0.0.3-alpha |  ❌   |    ❌    |
| JavaScript     | 0.0.3-alpha |  ❌   |    ❌    |
| Android (Java) |      ❌      |  ❌   |    ❌    |
| iOS (Swift)    |      ❌      |  ❌   |    ❌    |

### Back-end

| Ruby (Sinatra) | Ruby (Rails) | Node.js | C++11 |
| :------------: | :----------: | :-----: | :---: |
|       ❌        |      ❌       |    ❌    |   ❌   |

* **Alpha** versions always provide the latest features
* **Beta** versions are developing versions with 100% code coverage.
* **Release** versions provide stable APIs that would be seldomly changed or removed.

## Features

- **Virtual Request**, no real connections or requests managed by developers. The library would find the most optimized way to communicate with server.
- **AJAX-like API**, zero learning cost as long as you have ever dealed with AJAX development.
- **Compressed WebSocket**, internal compression engine, written in pure TypeScript/JavaScript code, providing fast compression on most browsers.
- **AJAX-Fallback**, fall back to typical AJAX if the browser still does not support WebSocket.

## Getting Started

```javascript
N.url = 'foo.bar/noaj';
N.secured = false; // turn to 'true' if using https and wss

N.request({
    route: '/hello'
}).send();

N.request({
    route: '/hello',
    data: {foo: 'bar'}
    success: function(data){
        console.log(data);
}}).send();
```

## Developing Status

| Feature               | Alpha | Beta | Release | Note |
| --------------------- | :---: | :--: | :-----: | :--: |
| AJAX-like API         |   ✅   |  ❌   |    ❌    |      |
| WebSocket             |   ✅   |  ❌   |    ❌    |      |
| AJAX Fallback         |   ✅   |  ❌   |    ❌    |      |
| Compression           |   ✅   |  ❌   |    ❌    |      |
| Garbage Collection    |   ✅   |  ❌   |    ❌    |      |
| GC Tuning             |   ✅   |  ❌   |    ❌    |      |
| Secured Communication |   ✅   |  ❌   |    ❌    |      |

