import React from 'react';
import type { State, Actions } from './types';

interface AuthContextType {
  state: State;
  dispatch: React.Dispatch<Actions>;
}

export const AuthContext = React.createContext<AuthContextType>({
  state: {} as State,
  dispatch: () => {},
});