import apn from "apn";

export const options: apn.ProviderOptions = {
  cert: "./cert/cert.pem", // Path to your cert.pem
  key: "./cert/key.pem", // Path to your key.pem
  production: false, // Set to true for production APNs
};
