import { createContext, useContext } from 'react';

export const TokenContext = createContext<{ token: string | null; updateToken: (newToken: string) => void }>({
  token: null,
  updateToken: () => {},
});

export const useSessionToken = () => useContext(TokenContext);

export default TokenContext;
