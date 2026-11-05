import type { State, Actions } from './types';
import { CommonService } from '../../../Services/commonServices.ts';


export function authReducer(state: State, action: Actions): State {


  switch (action.type) {
    case "Refresh":
      return {
        accessToken: CommonService.GetSessionValByKey("accessToken") ? CommonService.GetSessionValByKey("accessToken") : null,
        username: CommonService.GetSessionValByKey("userName") ? CommonService.GetSessionValByKey("username") : null,
        role: CommonService.GetSessionValByKey("role") ? CommonService.GetSessionValByKey("role") : null,
      } as State;
    case "LoginSuccess":
      return {
        accessToken: action.data.accessToken,
        username: action.data.username,
        role: action.data.role
      } as State;
    case "Logout":
      return {
        accessToken: null,
        username: null,
        role: null
      } as State;
    default:
      return {
        accessToken: CommonService.GetSessionValByKey("accessToken") ? CommonService.GetSessionValByKey("accessToken") : null,
        username: CommonService.GetSessionValByKey("username") ? CommonService.GetSessionValByKey("username") : null,
        role: CommonService.GetSessionValByKey("role") ? CommonService.GetSessionValByKey("role") : null
      } as State

  };
}