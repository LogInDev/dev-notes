import axios from "axios";
const api = axios.create({baseURL : '/api'})
// (선택) 개발 로그
api.interceptors.request.use((cfg) => {
    console.log('[API REQ]', cfg.method?.toUpperCase(), (cfg.baseURL||'') + (cfg.url||''), cfg.params || cfg.data);
    return cfg;
});
api.interceptors.response.use(
    (res) => { console.log('[API RES]', res.status, res.config.url); return res; },
    (err) => { console.error('[API ERR]', err?.response?.status, err?.config?.url, err?.message); return Promise.reject(err); }
);
export default api;