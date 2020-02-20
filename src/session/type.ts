export interface Profile {
  firstName: string,
  lastName: string
}

export interface OptionSet {
  id: number,
  name: string
}

export interface SessionUser {
  profile: Profile,
  language: OptionSet,
  id: number,
  email: string,
  permissions: string[],
  urlRedirect?:string,
  isAdmin?:boolean
}
