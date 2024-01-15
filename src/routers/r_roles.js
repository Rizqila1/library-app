import express from "express";
import {
  createRole,
  deleteRole,
  getAllRoles,
  getDetailRole,
  updateRole,
} from "../controllers/c_roles.js";
import { admin, authentication, manager } from "../config/auth.js";

const Router = express.Router();

Router.get("/roles", authentication, admin, getAllRoles);
Router.post("/roles/create", authentication, manager, createRole);
Router.get("/roles/details/:id", authentication, admin, getDetailRole);
Router.put("/roles/update/:id", authentication, manager, updateRole);
Router.delete("/roles/delete/:id", authentication, manager, deleteRole);

export default Router;
