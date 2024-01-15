import jwt from "jsonwebtoken";
import { SECRET_KEY_JWT } from "./secret.js";
import Messages from "../utils/messages.js";
import ModelTokens from "../models/m_tokens.js";

const authentication = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) return Messages(res, 401, "Token is required");

  const token = authorization.replace("Bearer ", "");

  jwt.verify(token, SECRET_KEY_JWT, async (err, result) => {
    if (err) {
      const JsonWebTokenError = ["JsonWebTokenError"].includes(err?.name);
      const TokenExpiredError = ["TokenExpiredError"].includes(err?.name);

      const errorMessage = TokenExpiredError
        ? "Token Expired"
        : JsonWebTokenError
        ? "Invalid Token"
        : err?.message;

      Messages(res, 403, errorMessage);
    }

    // create user response for access role
    res.access = result?.role.name;

    // create user response for borrow a book
    res.user = {
      _id: result?._id,
      full_name: result?.full_name,
      email: result?.email,
    };

    // create token data response for updating token data
    res.token = {
      id_token: result?.id_token,
    };

    const dataToken = { ...res.token };
    const UUID_token = dataToken.id_token;
    const isValidToken = await ModelTokens.findOne({ UUID_token: UUID_token });

    if (isValidToken?.revoke === 1)
      return Messages(res, 403, "Token is no longer valid");

    next();
  });
};

const manager = (req, res, next) => {
  const isManagerAccess = ["manager"].includes(res.access);
  if (!isManagerAccess) return Messages(res, 403, "Forbidden Access");

  next();
};

const admin = (req, res, next) => {
  const isAdminAccess =
    ["admin"].includes(res.access) || ["manager"].includes(res.access);
  if (!isAdminAccess) return Messages(res, 403, "Forbidden Access");

  next();
};

const user = (req, res, next) => {
  const isCustomerAccess =
    ["user"].includes(res.access) ||
    ["admin"].includes(res.access) ||
    ["manager"].includes(res.access);
  if (!isCustomerAccess) return Messages(res, 403, "Forbidden Access");

  next();
};

export { authentication, admin, user, manager };
