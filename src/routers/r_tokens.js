import express from "express";
import {
  ForceLogoutAllSignedUser,
  ForceLogoutSignedUser,
  deleteDataToken,
  detailTokenData,
  getAllTokens,
} from "../controllers/c_tokens.js";

import { authentication, admin, manager } from "../config/auth.js";

const Router = express.Router();

Router.get("/tokens", authentication, admin, getAllTokens);
Router.get("/tokens/details/:id", authentication, admin, detailTokenData);
Router.put(
  "/tokens/force-logout/:id",
  authentication,
  admin,
  ForceLogoutSignedUser
);
Router.put(
  "/tokens/force-logout-all",
  authentication,
  admin,
  ForceLogoutAllSignedUser
);
Router.delete("/tokens/delete/:id", authentication, manager, deleteDataToken);

export default Router;
