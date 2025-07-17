import { UserFormSchemaType } from '../_components/Profile/Form';
import { getAxios } from './axios';

export const saveProfile = (body: UserFormSchemaType) => {
  const axios = getAxios();
  return axios.post(`/user`, body);
};
