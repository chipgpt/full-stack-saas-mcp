import { useQuery } from '@tanstack/react-query';
import { getAxios, handleAxiosError } from './axios';

export const useVault = () => {
  const axios = getAxios();

  const query = useQuery({
    queryKey: ['/vault'],
    queryFn: () =>
      axios.get<{
        data: {
          name: string;
          value: number;
          guesses: number[];
          min: number;
          max: number;
          winningVaultGuess: number | null;
        };
      }>(`/vault`),
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    throwOnError(error) {
      handleAxiosError()(error);
      return false;
    },
  });

  return {
    vault: query.data?.data.data,
    query: query,
  };
};
