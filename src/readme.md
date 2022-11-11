# axios 重复请求处理
Axios 是一个基于 Promise 的 HTTP 客户端，同时支持浏览器和 Node.js 环境。它是一个优秀的 HTTP 客户端，被广泛地应用在大量的 Web 项目中。

## 如何取消请求
对于浏览器环境来说，Axios 底层是利用 XMLHttpRequest 对象来发起 HTTP 请求。

如果要取消请求的话，我们可以通过调用 XMLHttpRequest 对象上的 abort 方法来取消请求：
```javascript
let xhr = new XMLHttpRequest();
xhr.open("GET", "https://developer.mozilla.org/", true);
xhr.send();
setTimeout(() => xhr.abort(), 300);
```
而对于 Axios 来说，我们可以通过 Axios 内部提供的 CancelToken 来取消请求：
```javascript
const CancelToken = axios.CancelToken;
const source = CancelToken.source();

axios.post('/user/info', {
  name: 'semlinker'
}, {
  cancelToken: source.token
})

source.cancel('取消请求'); // 取消请求，参数是可选的
```
此外，你也可以通过调用 CancelToken 的构造函数来创建 CancelToken，具体如下所示：
```javascript
const CancelToken = axios.CancelToken;
let cancel;

axios.post('/user/info', {
  name: 'andyljzhou'
}, {
  cancelToken: new CancelToken(function executor(c) {
    cancel = c;
  })
});

cancel(); // 取消请求
```
## 如何判断重复请求
当请求方式、请求 URL 地址和请求参数都一样时，我们就可以认为请求是一样的。

因此在每次发起请求时，我们就可以根据当前请求的请求方式、请求 URL 地址和请求参数来生成一个唯一的 key，同时为每个请求创建一个专属的 CancelToken，然后把 key 和 cancel 函数以键值对的形式保存到 Map 对象中，使用 Map 的好处是可以快速的判断是否有重复的请求：
```javascript
import qs from 'qs'

const pendingRequest = new Map();
// GET -> params；POST -> data
const requestKey = [method, url, qs.stringify(params), qs.stringify(data)].join('&'); 
const cancelToken = new CancelToken(function executor(cancel) {
  if(!pendingRequest.has(requestKey)){
    pendingRequest.set(requestKey, cancel);
  }
})
```
