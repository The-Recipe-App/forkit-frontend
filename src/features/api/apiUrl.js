import backendUrlV1 from "../../urls/backendUrl";

export function apiUrl(path) {
  if (!path.startsWith("/")) path = "/" + path;

  // If backendUrlV1 is empty → same-origin
  return backendUrlV1
    ? backendUrlV1 + path.replace(/^\/+/, "")
    : path;
}
