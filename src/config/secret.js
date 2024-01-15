import * as dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3010;
const URL_DB = process.env.URL_DB;
const SECRET_KEY_JWT = process.env.SECRET_KEY_JWT;
const CLOUD_NAME = process.env.CLOUD_NAME;
const API_KEY = process.env.API_KEY;
const API_SECRET = process.env.API_SECRET;
const SEED_USER_MANAGER_EMAIL = process.env.SEED_USER_MANAGER_EMAIL;
const SEED_USER_MANAGER_PASSWORD = process.env.SEED_USER_MANAGER_PASSWORD;
const SEED_USER_ADMIN_EMAIL = process.env.SEED_USER_ADMIN_EMAIL;
const SEED_USER_ADMIN_PASSWORD = process.env.SEED_USER_ADMIN_PASSWORD;

export {
  PORT,
  URL_DB,
  SECRET_KEY_JWT,
  CLOUD_NAME,
  API_KEY,
  API_SECRET,
  SEED_USER_MANAGER_EMAIL,
  SEED_USER_MANAGER_PASSWORD,
  SEED_USER_ADMIN_EMAIL,
  SEED_USER_ADMIN_PASSWORD,
};
