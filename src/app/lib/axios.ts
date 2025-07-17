import Axios, { isAxiosError } from 'axios';

export interface IPaginationResponse<TData = {}, TMeta = void> {
  data: TData[];
  pagination: { page: number; limit: number; total: number };
  meta: TMeta;
}

export const handleAxiosError = (callback?: (err: Error) => void) => (err: Error) => {
  if (isAxiosError(err) && err.response?.status === 401) {
    if (location.pathname !== `/api/auth/signin`) {
      location.href = `/api/auth/signin`;
    }
  }
  if (callback) {
    callback(err);
  }
};

export const DEFAULT_MUTATION_ERROR = (err: Error) => {
  if (isAxiosError(err)) {
    if (err.response?.data?.error?.message) {
      // toast(err.response.data.error.message, { type: 'error' });
    } else {
      // toast('An unexpected error has occurred', { type: 'error' });
    }
  }
};

export const getAxios = () => {
  const axios = Axios.create({
    baseURL: `/api`,
  });

  axios.interceptors.request.use(config => {
    config.headers = config.headers || {};

    const jwt = localStorage.getItem('account_auth_token');
    if (jwt) {
      config.headers['x-auth-token'] = jwt;
    }

    return config;
  });

  return axios;
};
