import * as JWT from './jwt';
import * as Validate from './validate';

export { JWT, Validate };

const isBasicAuthenticated = (name, pass) => basicAuth({name, pass});

// NOTE: Returns separate middleware for responding to OPTIONS requests with an Allow header containing the allowed methods, as well as responding with
// - 405 Method Not Allowed and
// - 501 Not Implemented as appropriate.
const routes = router => compose([router.routes(), router.allowedMethods()]);

export default {
  isBasicAuthenticated,
  routes
};