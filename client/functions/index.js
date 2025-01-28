import { weatherFunction, handler as weatherHandler } from "./weather";
import { accountFunction, accountHandler } from "./account";

// All function definitions
const functions = [weatherFunction, accountFunction];

// Handler map
const handlers = {
  [weatherFunction.name]: weatherHandler,
  [accountFunction.name]: accountHandler
};

export function getFunctionSchemas() {
  return functions;
}

export function getFunctionHandler(name) {
  return handlers[name];
}
