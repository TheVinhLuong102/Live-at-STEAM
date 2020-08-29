export type UserData = {
    isLoggedIn: boolean,
    jwtToken?: string,
    username?: string,
    role?: number // admin = 0, mod = 1, member = 2
    // TODO: use constants for roles
}
  
