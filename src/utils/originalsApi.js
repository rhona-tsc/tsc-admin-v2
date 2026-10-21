import axios from "axios";
import { backendUrl } from "../App";

const originalsFlag = import.meta.env.VITE_ORIGINALS_ENABLED;
export const originalsEnabled =
  originalsFlag === undefined || String(originalsFlag).trim() === ""
    ? true
    : String(originalsFlag).toLowerCase() === "true";

export const originalsRequest = (token, config) =>
  axios({
    baseURL: `${backendUrl}/api/originals`,
    withCredentials: true,
    ...config,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}`, token } : {}),
      ...(config?.headers || {}),
    },
  });
