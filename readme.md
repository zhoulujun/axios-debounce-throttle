# axios 重复请求处理
Axios 是一个基于 Promise 的 HTTP 客户端，同时支持浏览器和 Node.js 环境。它是一个优秀的 HTTP 客户端，被广泛地应用在大量的 Web 项目中。

对于同一用户短时间内重复提交数据的问题，前端通常可以先做一层拦截。
## 如何取消请求
对于浏览器环境来说，Axios 底层是利用 XMLHttpRequest 对象来发起 HTTP 请求。
### XMLHttpRequest 如何取消请求
如果要取消请求的话，我们可以通过调用 XMLHttpRequest 对象上的 abort 方法来取消请求：
```javascript
let xhr = new XMLHttpRequest();
xhr.open("GET", "https://developer.mozilla.org/", true);
xhr.send();
setTimeout(() => xhr.abort(), 300);
```
### Axios 如何取消请求
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
通过 /node_modules/axios/lib/cancel/CancelToken.js
这两个例子并没有本质区别
第二个例子中的 new CancelToken(...) 就是第一个例子中 CancelToken.source() 的一部分。

区别就是第二个例子是在请求的配置项里单例生成一个 token ，并把 cancel 方法赋值到一个外部变量中；

而第一个例子是通过一个工厂方法 CancelToken.source 创建一个对象 source:{token,cancel} 然后在具体的请求配置里引用它。
> 第一个例子里的 **source 可以很方便的被多个请求配置来引用，如果多个请求同时使用这一个 source.token，我们在调用 source.cancel 的时候，就会同时取消这些请求**。

+ 当业务中需要根据时机取消某一个请求时，用第二个例子的方法单例生成 token 就可以了。
```javascript

let cancelTokenSource = []
function cancelRequest(){
  // 不做整个逻辑，后续的请求无法发出。
  while (cancelTokenSource.length) {
    const cancel = cancelTokenSource.pop();
    if (cancel) {
      cancel();
      timeoutStatus.value = status;
    }
  }
}
function getUserInfo(){
  cancelRequest()
  axios.post('/user/info', {
    name: 'semlinker'
  }, {
    cancelToken: source.token
  })
}
```
+ 当业务中需要**根据时机取消多个请求时**，建议使用第一个例子中的方法，生成一个外部的 token，让这些请求配置同时使用，然后可以通过一个 cancel 方法全部取消。
```javascript
let cancelTokenSource
function cancelRequest(){
  // 不做整个逻辑，后续的请求无法发出。
  if(cancelTokenSource){
    cancelTokenSource.cancel()
    cancelTokenSource = null
  }else {
    cancelTokenSource = axios.CancelToken.source()
  }
}
function getUserInfo(){
  cancelRequest()
  axios.post('/user/info', {
    name: 'semlinker'
  }, {
    cancelToken: source.token
  })
}
```
当然可以去全局管理
```javascript
let cancelTokenSource = axios.CancelToken.source
function cancelRequest(){
  cancelTokenSource.cancel()
}
const http = axios.create({
  timeout: 1000 * 120,
  withCredentials: true,
  xsrfCookieName: 'X-CSRFToken',
  baseURL: window.PROJECT_CONFIG?.SITE_URL || '',
  cancelToken:cancelTokenSource.token,
});
function getUserInfo(){
  http.post('/user/info', {
    name: 'semlinker'
  }, {
    cancelToken: source.token
  })
}
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





## 参考内容：
+ [axios.CancelToken在项目中的一些运用](https://juejin.cn/post/6865909895913766926)
+ [Axios 如何取消重复请求？](https://juejin.cn/post/6955610207036801031)
