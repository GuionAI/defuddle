```json
{
  "title": "Route | Playwright",
  "author": "",
  "site": "",
  "published": ""
}
```

Whenever a network route is set up with [page.route()](/docs/api/class-page#page-route) or [browserContext.route()](/docs/api/class-browsercontext#browser-context-route), the `Route` object allows to handle the route.

Learn more about [networking](/docs/network).

---

## Methods

### abort

Added before v1.9route.abort

Aborts the route's request.

**Usage**

```js
await route.abort();
await route.abort(errorCode);
```

**Arguments**

- `errorCode`[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string")*(optional)*
	Optional error code. Defaults to `failed`, could be one of the following:
	- `'aborted'` - An operation was aborted (due to user action)
	- `'accessdenied'` - Permission to access a resource, other than the network, was denied
	- `'addressunreachable'` - The IP address is unreachable. This usually means that there is no route to the specified host or network.
	- `'blockedbyclient'` - The client chose to block the request.
	- `'blockedbyresponse'` - The request failed because the response was delivered along with requirements which are not met ('X-Frame-Options' and 'Content-Security-Policy' ancestor checks, for instance).
	- `'connectionaborted'` - A connection timed out as a result of not receiving an ACK for data sent.
	- `'connectionclosed'` - A connection was closed (corresponding to a TCP FIN).
	- `'connectionfailed'` - A connection attempt failed.
	- `'connectionrefused'` - A connection attempt was refused.
	- `'connectionreset'` - A connection was reset (corresponding to a TCP RST).
	- `'internetdisconnected'` - The Internet connection has been lost.
	- `'namenotresolved'` - The host name could not be resolved.
	- `'timedout'` - An operation timed out.
	- `'failed'` - A generic failure occurred.

**Returns**

- [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise "Promise")<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined "void")\>

---

### continue

Added before v1.9route.continue

Sends route's request to the network with optional overrides.

**Usage**

**Arguments**

- `options`[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object")*(optional)*
	- `headers`[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object")<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string"), [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string")\>*(optional)*
		If set changes the request HTTP headers. Header values will be converted to a string.
	- `method`[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string")*(optional)*
		If set changes the request method (e.g. GET or POST).
	- `postData`[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string") | [Buffer](https://nodejs.org/api/buffer.html#buffer_class_buffer "Buffer") | [Serializable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#Description "Serializable")*(optional)*
		If set changes the post data of request.
	- `url`[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string")*(optional)*
		If set changes the request URL. New URL must have same protocol as original one.

**Returns**

- [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise "Promise")<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined "void")\>

**Details**

The [headers](/docs/api/class-route#route-continue-option-headers)option applies to both the routed request and any redirects it initiates. However, [url](/docs/api/class-route#route-continue-option-url),[method](/docs/api/class-route#route-continue-option-method), and [postData](/docs/api/class-route#route-continue-option-post-data)only apply to the original request and are not carried over to redirected requests.

[route.continue()](/docs/api/class-route#route-continue)will immediately send the request to the network, other matching handlers won't be invoked. Use [route.fallback()](/docs/api/class-route#route-fallback)If you want next matching handler in the chain to be invoked.

---

### fallback

Added in: v1.23route.fallback

Continues route's request with optional overrides. The method is similar to [route.continue()](/docs/api/class-route#route-continue)with the difference that other matching handlers will be invoked before sending the request.

**Usage**

When several routes match the given pattern, they run in the order opposite to their registration. That way the last registered route can always override all the previous ones. In the example below, request will be handled by the bottom-most handler first, then it'll fall back to the previous one and in the end will be aborted by the first registered route.

```js
await page.route('**/*', async route => {
 // Runs
                                                                        last.
 await route.abort();
});
await page.route('**/*', async route => {
 // Runs
                                                                        second.
 await route.fallback();
});
await page.route('**/*', async route => {
 // Runs
                                                                        first.
 await route.fallback();
});
```

Registering multiple routes is useful when you want separate handlers to handle different kinds of requests, for example API calls vs page resources or GET requests vs POST requests as in the example below.

```js
// Handle GET
                                                                        requests.
await page.route('**/*', async route => {
 if (route.request().method() !== 'GET') {
 await route.fallback();
 return;
 }
 // Handling
                                                                        GET only.
 //
                                                                        ...
});

// Handle POST
                                                                        requests.
await page.route('**/*', async route => {
 if (route.request().method() !== 'POST') {
 await route.fallback();
 return;
 }
 // Handling
                                                                        POST only.
 //
                                                                        ...
});
```

One can also modify request while falling back to the subsequent handler, that way intermediate route handler can modify url, method, headers and postData of the request.

Use [route.continue()](/docs/api/class-route#route-continue)to immediately send the request to the network, other matching handlers won't be invoked in that case.

**Arguments**

- `options`[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object")*(optional)*
	- `headers`[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object")<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string"), [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string")\>*(optional)*
		If set changes the request HTTP headers. Header values will be converted to a string.
	- `method`[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string")*(optional)*
		If set changes the request method (e.g. GET or POST).
	- `postData`[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string") | [Buffer](https://nodejs.org/api/buffer.html#buffer_class_buffer "Buffer") | [Serializable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#Description "Serializable")*(optional)*
		If set changes the post data of request.
	- `url`[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string")*(optional)*
		If set changes the request URL. New URL must have same protocol as original one. Changing the URL won't affect the route matching, all the routes are matched using the original request URL.

**Returns**

- [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise "Promise")<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined "void")\>

---

### fetch

Added in: v1.29route.fetch

Performs the request and fetches result without fulfilling it, so that the response could be modified and then fulfilled.

**Usage**

```js
await page.route('https://dog.ceo/api/breeds/list/all', async route => {
 const response = await route.fetch();
 const json = await response.json();
 json.message['big_red_dog'] = [];
 await route.fulfill({ response, json });
});
```

**Arguments**

- `options`[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object")*(optional)*
	- `headers`[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object")<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string"), [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string")\>*(optional)*
		If set changes the request HTTP headers. Header values will be converted to a string.
	- `maxRedirects`[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number")*(optional)*Added in: v1.31
		Maximum number of request redirects that will be followed automatically. An error will be thrown if the number is exceeded. Defaults to `20`. Pass `0` to not follow redirects.
	- `maxRetries`[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number")*(optional)*Added in: v1.46
		Maximum number of times network errors should be retried. Currently only `ECONNRESET`error is retried. Does not retry based on HTTP response codes. An error will be thrown if the limit is exceeded. Defaults to `0` - no retries.
	- `method`[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string")*(optional)*
		If set changes the request method (e.g. GET or POST).
	- `postData`[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string") | [Buffer](https://nodejs.org/api/buffer.html#buffer_class_buffer "Buffer") | [Serializable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#Description "Serializable")*(optional)*
		Allows to set post data of the request. If the data parameter is an object, it will be serialized to json string and `content-type` header will be set to `application/json` if not explicitly set. Otherwise the`content-type` header will be set to`application/octet-stream` if not explicitly set.
	- `timeout`[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number")*(optional)*Added in: v1.33
		Request timeout in milliseconds. Defaults to`30000` (30 seconds). Pass `0`to disable timeout.
	- `url`[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string")*(optional)*
		If set changes the request URL. New URL must have same protocol as original one.

**Returns**

- [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise "Promise")<[APIResponse](/docs/api/class-apiresponse "APIResponse")\>

**Details**

Note that [headers](/docs/api/class-route#route-fetch-option-headers)option will apply to the fetched request as well as any redirects initiated by it. If you want to only apply [headers](/docs/api/class-route#route-fetch-option-headers)to the original request, but not to redirects, look into [route.continue()](/docs/api/class-route#route-continue)instead.

---

### fulfill

Added before v1.9route.fulfill

Fulfills route's request with given response.

**Usage**

An example of fulfilling all requests with 404 responses:

```js
await page.route('**/*', async route => {
 await route.fulfill({
 status: 404,
 contentType: 'text/plain',
 body: 'Not
                                                                        Found!'
 });
});
```

An example of serving static file:

```js
await page.route('**/xhr_endpoint', route => route.fulfill({ path: 'mock_data.json' }));
```

**Arguments**

- `options`[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object")*(optional)*
	- `body`[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string") | [Buffer](https://nodejs.org/api/buffer.html#buffer_class_buffer "Buffer")*(optional)*
		Response body.
	- `contentType`[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string")*(optional)*
		If set, equals to setting `Content-Type`response header.
	- `headers`[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object")<[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string"), [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string")\>*(optional)*
		Response headers. Header values will be converted to a string.
	- `json`[Serializable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#Description "Serializable")*(optional)*Added in: v1.29
		JSON response. This method will set the content type to `application/json` if not set.
	- `path`[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "string")*(optional)*
		File path to respond with. The content type will be inferred from file extension. If `path`is a relative path, then it is resolved relative to the current working directory.
	- `response`[APIResponse](/docs/api/class-apiresponse "APIResponse")*(optional)*Added in: v1.15
		[APIResponse](/docs/api/class-apiresponse "APIResponse")to fulfill route's request with. Individual fields of the response (such as headers) can be overridden using fulfill options.
	- `status`[number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number")*(optional)*
		Response status code, defaults to `200`.

**Returns**

- [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise "Promise")<[void](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined "void")\>

---

### request

Added before v1.9route.request

A request to be routed.

**Usage**

```js
route.request();
```

**Returns**

- [Request](/docs/api/class-request "Request")