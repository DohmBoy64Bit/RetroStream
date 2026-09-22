import { handleRobotsRequest } from '../worker/index.js';

export function GET(request) {
  return handleRobotsRequest(request);
}
