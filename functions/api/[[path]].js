import { proxyTo } from '../_shared/proxy.js';

export async function onRequest({ request, params, env }) {
    const url = new URL(request.url);
    const path = params.path?.join('/') ?? '';
    return proxyTo(request, `${env.BACKEND_URL}/api/${path}${url.search}`);
}