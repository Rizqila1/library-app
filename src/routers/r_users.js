import express from "express";
import {
  GetAllDataUsers,
  activateUser,
  deactivateUser,
  deleteUser,
  detailUser,
  loginUser,
  logoutUser,
  registerUser,
  updateUser,
} from "../controllers/c_users.js";

import { authentication, admin, manager, user } from "../config/auth.js";
import uploadImg from "../middleware/multer.js";

const Router = express.Router();

Router.get("/users", authentication, admin, GetAllDataUsers);
Router.post("/users/register", registerUser);
Router.post("/users/login", loginUser);
Router.post("/users/logout", authentication, logoutUser);
Router.get("/users/details/:id", authentication, admin, detailUser);
Router.put("/users/update/:id", authentication, user, uploadImg, updateUser);
Router.put("/users/activate/:id", authentication, admin, activateUser);
Router.put("/users/deactivate/:id", authentication, admin, deactivateUser);
Router.delete("/users/delete/:id", authentication, manager, deleteUser);

export default Router;
