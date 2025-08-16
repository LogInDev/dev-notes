import axios from "axios";
const api = axios.create({baseURL: '/api'})
api.interceptors.response.use(
    res => res,
    err => {
        console.error(err);
        return Promise.reject(err);
    }
);
export default api;