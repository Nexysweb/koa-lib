export interface Profile {
  firstName: string,
  lastName: string
}

export interface OptionSet {
  id: number,
  name: string
}

export interface UserSession {
  profile: Profile,
  language: OptionSet,
  id: number,
  email: string,
  permissions: string[],
  urlRedirect?:string,
  isAdmin?:boolean
}
