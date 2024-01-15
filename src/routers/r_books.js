import express from "express";
import {
  getAllDataBooks,
  detailBookData,
  addBook,
  updateBook,
  deleteBook,
} from "../controllers/c_books.js";
import { admin, authentication, user } from "../config/auth.js";
import uploadImg from "../middleware/multer.js";

const Router = express.Router();

Router.get("/books", getAllDataBooks);
Router.post("/books/create", authentication, admin, uploadImg, addBook);
Router.get("/books/details/:id", authentication, user, detailBookData);
Router.put("/books/update/:id", authentication, admin, uploadImg, updateBook);
Router.delete("/books/delete/:id", authentication, admin, deleteBook);

export default Router;
