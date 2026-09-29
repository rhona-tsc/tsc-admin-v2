import axios from "axios";
import { backendUrl } from "../App";

export const originalsEnabled =
  String(import.meta.env.VITE_ORIGINALS_ENABLED || "").toLowerCase() === "true";

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
