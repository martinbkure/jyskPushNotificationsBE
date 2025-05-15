import apn from "apn";
import path from "path";

export const options: apn.ProviderOptions = {
  cert: path.resolve(__dirname, "cert/cert.pem"),
  key: path.resolve(__dirname, "cert/key.pem"),
  production: false,
};
