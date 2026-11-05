export type Actions =
  | { type: "Refresh", data: any }
  | { type: "LoginSuccess", data: any }
  | { type: "Logout", data: any }
   ;
  

export interface State {
    accessToken: string | null,
    username: string | null,
    role: string | null
}
