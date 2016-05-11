# NOAJ

## What is NOAJ
NOAJ (Not Only Asynchronous JavaScript, formerly called [yukkikaze.js](https://github.com/dsh0416/yukkikaze.js)) is a communication framework which provides AJAX-like API based on WebSocket. It could dynamically manage the socket pool to reduce the redundant package headers. It could also fallback to AJAX if the browser does not support WebSocket feature.

## Developing Status

### Front-end

| TypeScript  | JavaScript  |
| ----------- | ----------- |
| 0.0.1-alpha | 0.0.1-alpha |

### Back-end

| Ruby (Sinatra) | Ruby (Rails)   | Node.js        | C++11          |
| -------------- | -------------- | -------------- | -------------- |
| No release yet | No release yet | No release yet | No release yet |

## Getting Started

```javascript
N.url = 'http://foo.bar/noaj'

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
