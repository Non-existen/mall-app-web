// functions/api/[[path]].js
export async function onRequest(context) {
  const { request, env } = context;

  // 后端地址从环境变量读取，方便以后切换
  // 示例： http://api-shop.jijing.sbs:8085
  const BACKEND = env.BACKEND_ORIGIN || 'http://66.154.119.236:8085';

  const url = new URL(request.url);
  // 把 /api 前缀替换掉，构造到后端的完整路径
  // 例如 /api/products?page=1 -> http://...:8085/products?page=1
  const backendPath = url.pathname.replace(/^\/api/, '') || '/';
  const backendUrl = BACKEND + backendPath + url.search;

  // 处理 CORS 预检请求（OPTIONS）
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '3600'
      }
    });
  }

  // 构造到后端的请求（保留 method/body/headers 中常用字段）
  const reqHeaders = new Headers(request.headers);
  // 可移除或覆盖一些不需要的头
  reqHeaders.set('host', new URL(BACKEND).host);

  const fetchReq = new Request(backendUrl, {
    method: request.method,
    headers: reqHeaders,
    body: request.body,
    redirect: 'manual'
  });

  // 转发请求到后端
  const resp = await fetch(fetchReq);

  // 从后端响应中复制 body & 状态码 & headers（并注入 CORS）
  const respHeaders = new Headers(resp.headers);

  // 强制返回允许跨域（Pages -> 浏览器）
  respHeaders.set('Access-Control-Allow-Origin', '*');
  respHeaders.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  respHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 返回响应
  const body = await resp.arrayBuffer();
  return new Response(body, {
    status: resp.status,
    headers: respHeaders
  });
}
