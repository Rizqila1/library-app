import express from "express";
import {
  getAllDataBorrowing,
  createBorrowBooks,
  returnBook,
  deleteDataBorrowing,
  detailBorrowing,
  forceReturnBorrowing,
  forceReturnAllBorrowing,
  historyBorrowing,
} from "../controllers/c_borrowing.js";
import { authentication, admin, user, manager } from "../config/auth.js";

const Router = express.Router();

Router.get("/borrowing", authentication, admin, getAllDataBorrowing);
Router.post("/borrowing/create/:id", authentication, user, createBorrowBooks);
Router.put("/borrowing/return/:id", authentication, user, returnBook);
Router.get("/borrowing/detail/:id", authentication, admin, detailBorrowing);
Router.get("/borrowing/history/:id", authentication, user, historyBorrowing);
Router.delete(
  "/borrowing/delete/:id",
  authentication,
  manager,
  deleteDataBorrowing
);
Router.put(
  "/borrowing/force-return/:id",
  authentication,
  admin,
  forceReturnBorrowing
);
Router.put(
  "/borrowing/force-return-all",
  authentication,
  admin,
  forceReturnAllBorrowing
);

export default Router;
