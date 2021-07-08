import Local from './session/local';

// types: todo
export interface ISession {
  key:string,
  duration: number,
  signed: boolean,
  signatureKeys:string[],
  config?:ISessionConfig,
  httpOnly?:boolean,
  local?:any,
  redis?:any
}
// todo change structure, see below
export interface IStrategy {
  type: string,
  host?: string,
  auth?: string,
  usernameField?: string,
  issuer?: string,
  secretOrKey?:string,
  fromSession?:boolean
}
interface StrategyLocal {
  host: string,
  auth: string,
  usernameField: string
}
interface StrategyJwt {
  issuer: string,
  secretOrKey:string,
  fromSession:boolean
}
// todo
type StrategyNew = StrategyLocal | StrategyJwt;
export interface IOptions {
  agent?: boolean,
  production?: boolean,
  session?: ISession,
  auth?: {
    strategies: IStrategy[]
  },
  messages?:string[]
}
// end types

export interface ISessionConfig {
  key:string,
  store:Local,
  maxAge: number,// duration in ms
  httpOnly:boolean, // NOTE: prevent client-side access to cookie (document.cookie)
  signed:boolean
  // secure: inProd // NOTE: cookie only sent over https => doesn't detect https from nginx
}