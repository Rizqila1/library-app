import express from "express";
import { admin, authentication } from "../config/auth.js";
import {
  createCategory,
  deleteCategory,
  detailCategory,
  getAllCategories,
  updateCategory,
} from "../controllers/c_categories.js";

const Router = express.Router();

Router.get("/categories", getAllCategories);
Router.post("/category/create", authentication, admin, createCategory);
Router.get("/category/details/:id", authentication, admin, detailCategory);
Router.put("/category/update/:id", authentication, admin, updateCategory);
Router.delete("/category/delete/:id", authentication, admin, deleteCategory);

export default Router;
