import { useQuery } from '@tanstack/react-query';
import { handleAxiosError, getAxios } from './axios';
import { IOAuthClient } from '@/server/models/oauth-client';

export enum OAuthClientGrantEnum {
  AuthorizationCode = 'authorization_code',
  RefreshToken = 'refresh_token',
}

export enum OAuthClientScopeEnum {
  Read = 'read',
  Write = 'write',
}

export const useOAuthClient = (params: { id: string }) => {
  const axios = getAxios();

  const query = useQuery({
    queryKey: ['/oauth/client', params],
    queryFn: () =>
      axios.get<{ data: IOAuthClient }>(`/oauth/client`, {
        params,
      }),
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    throwOnError(error) {
      handleAxiosError()(error);
      return false;
    },
    enabled: !!params.id,
  });

  return {
    oauthClient: query.data?.data.data,
    query: query,
  };
};
