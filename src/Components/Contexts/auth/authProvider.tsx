import React, { useReducer, type ReactNode } from "react";
import { authReducer } from "./authReducer.ts";
import { AuthContext } from './authContext.ts';
import { CommonService } from "../../../Services/commonServices.ts";


interface StateProviderProps {
  children: ReactNode;
}

// Create the provider component
export const AuthProvider: React.FC<StateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer,{
                accessToken: CommonService.GetSessionValByKey("accessToken") ?  CommonService.GetSessionValByKey("accessToken") : null,
                username: CommonService.GetSessionValByKey("username") ? CommonService.GetSessionValByKey("username") : null,
                role: CommonService.GetSessionValByKey("role") ? CommonService.GetSessionValByKey("role") : null
  });

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
