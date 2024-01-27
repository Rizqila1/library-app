import ModelBorrowing from "../models/m_borrowing.js";
import Messages from "../utils/messages.js";
import ModelBooks from "../models/m_books.js";
import ModelUsers from "../models/m_users.js";
import { Types } from "mongoose";

const createBorrowBooks = async (req, res) => {
  const _id = req.params.id;
  const dataUser = { ...res.user };

  try {
    const booksID = await ModelBooks.findById(_id);
    const getUserData = await ModelUsers.findById(dataUser._id);

    if (!booksID) return Messages(res, 404, "Book Not Found");

    if (getUserData.late_return_count > 3)
      return Messages(
        res,
        412,
        "You have reached more than 3 times late in returning book, you've been prohibited to borrow a book"
      );

    if (booksID.stock === 0)
      return Messages(res, 412, "Book is out of stock, come back later");

    // Create limit for borrowing a book
    const isUserBorrow = await ModelBorrowing.findOne({
      "user._id": dataUser._id,
      isBorrow: 1,
    });

    if (isUserBorrow) return Messages(res, 403, "You can only borrow 1 book");

    // const timeBorrow = currentDate.toLocaleString(options);
    // console.log(timeBorrow.replaceAll(/[/:, ]/g, ""));

    // Date
    const currentDate = new Date();
    function calculateDynamicDate() {
      // Calculate the date 30 minutes from now
      const dynamicDate = new Date(currentDate.getTime() + 30 * 60 * 1000);

      return dynamicDate;
    }

    const timeReturn = calculateDynamicDate();

    const payload = {
      user: { ...dataUser },
      isBorrow: 1,
      id_book: booksID._id,
      book_name: booksID.book_name,
      time: currentDate,
      expected_return: timeReturn,
      book_image: {
        url: booksID.book_image.url,
        cloudinary_id: booksID.book_image.cloudinary_id,
      },
    };

    const updateStock = {
      stock: booksID.stock - 1,
      total_borrowed: booksID.total_borrowed + 1,
    };

    await new ModelBorrowing(payload).save();
    await ModelBooks.findByIdAndUpdate(_id, updateStock, { new: true });

    Messages(res, 201, "Borrow Success", payload);
  } catch (error) {
    Messages(res, 500, error?.message || "Internal server error");
  }
};

const getAllDataBorrowing = async (req, res) => {
  const q = req.query.q ? req.query.q : "";

  const sort_by = req.query.sort_by ? req.query.sort_by.toLowerCase() : "desc";
  const sort_key = sort_by === "asc" ? 1 : -1;

  const page = req.query.page ? parseInt(req.query.page) : 1;
  const per_page = req.query.per_page ? parseInt(req.query.per_page) : 25;

  const pages = page === 1 ? 0 : (page - 1) * per_page;

  try {
    const filter = { "user.full_name": { $regex: q, $options: "i" } };

    const total = await ModelBorrowing.countDocuments(filter);
    const data = await ModelBorrowing.find(filter)
      .sort({ _id: sort_key })
      .skip(pages)
      .limit(per_page);

    Messages(res, 200, "All Data", data, {
      page,
      per_page,
      total,
    });
  } catch (error) {
    Messages(res, 500, error?.message || "Internal server error");
  }
};

const returnBook = async (req, res) => {
  const _id = req.params.id;

  try {
    const borrowID = await ModelBorrowing.findById(_id);
    if (!borrowID) Messages(res, 404, "ID borrow not found");

    const isReturned = borrowID.isBorrow;
    if (isReturned === 0)
      return Messages(res, 412, "Your book is already returned");

    const idBook = borrowID.id_book;
    const dataBook = await ModelBooks.findById(idBook);

    const updateStock = {
      stock: dataBook.stock + 1,
      total_borrowed: dataBook.total_borrowed - 1,
    };

    const bookReturnedTime = new Date();

    const updateIsBorrow = {
      isBorrow: 0,
      returned_at: bookReturnedTime,
    };

    const expectedReturnTime = new Date(borrowID.expected_return);
    const returnedTime = new Date(bookReturnedTime);
    const isLateReturn =
      JSON.stringify(expectedReturnTime) < JSON.stringify(returnedTime);

    if (isLateReturn) {
      const idUser = borrowID.user._id;
      const dataUser = await ModelUsers.findById(idUser);

      const payloadUpdateUser = {
        late_return_count: dataUser.late_return_count + 1,
      };

      await ModelUsers.findByIdAndUpdate(idUser, payloadUpdateUser, {
        new: true,
      });
    }

    await ModelBorrowing.findByIdAndUpdate(_id, updateIsBorrow, { new: true });
    await ModelBooks.findByIdAndUpdate(idBook, updateStock, { new: true });

    Messages(res, 200, `Return Book: ${borrowID.book_name} Success`);
  } catch (error) {
    Messages(res, 500, error?.message || "Internal Sever Error");
  }
};

const historyBorrowing = async (req, res) => {
  const id = req.params.id;

  const q = req.query.q ? req.query.q : "";

  const sort_by = req.query.sort_by ? req.query.sort_by.toLowerCase() : "desc";
  const sort_key = sort_by === "asc" ? 1 : -1;

  const page = req.query.page ? parseInt(req.query.page) : 1;
  const per_page = req.query.per_page ? parseInt(req.query.per_page) : 25;

  const pages = page === 1 ? 0 : (page - 1) * per_page;

  try {
    const filter = { time: { $regex: q, $options: "i" } };

    const total = await ModelBorrowing.countDocuments({
      $and: [{ "user._id": id }, filter],
    });

    const data = await ModelBorrowing.find({
      $and: [{ "user._id": id }, filter],
    })
      .sort({ _id: sort_key })
      .skip(pages)
      .limit(per_page);

    Messages(
      res,
      200,
      "All Data",
      { data },
      {
        page,
        per_page,
        total,
      }
    );
  } catch (error) {
    Messages(res, 500, error?.messages || "Internal Server Error");
  }
};

const deleteDataBorrowing = async (req, res) => {
  const _id = req.params.id;

  try {
    const borrowID = await ModelBorrowing.findById(_id);
    if (!borrowID) Messages(res, 404, "ID borrow not found");

    await ModelBorrowing.deleteOne({ _id: _id });

    Messages(res, 200, `Delete Data Borrowing Success`, borrowID);
  } catch (error) {
    Messages(res, 500, error?.message || "Internal Sever Error");
  }
};

const detailBorrowing = async (req, res) => {
  const id = req.params.id;

  try {
    const findBorrowing = await ModelBorrowing.findById(id);
    if (!findBorrowing)
      return Messages(res, 404, `Borrowing id ${id} not found`);

    Messages(res, 200, "Detail Data", findBorrowing);
  } catch (error) {
    Messages(res, 500, error?.message || "Internal server error");
  }
};

const forceReturnBorrowing = async (req, res) => {
  const id = req.params.id;

  try {
    const findBorrowing = await ModelBorrowing.findById(id);
    if (!findBorrowing)
      return Messages(res, 404, `Borrowing id ${id} not found`);

    if (findBorrowing.isBorrow === 0)
      return Messages(res, 412, "Book has already returned");

    const expectedReturnTime = new Date(findBorrowing.expected_return);
    const returnedTime = new Date();
    const isLateReturn =
      JSON.stringify(expectedReturnTime) < JSON.stringify(returnedTime);

    if (isLateReturn) {
      const idUser = findBorrowing.user._id;

      const dataUser = await ModelUsers.findById(idUser);

      const payloadUpdateUser = {
        late_return_count: dataUser.late_return_count + 1,
      };

      await ModelUsers.findByIdAndUpdate(idUser, payloadUpdateUser, {
        new: true,
      });
    }

    const payload = {
      isBorrow: 0,
      returned_at: returnedTime,
    };

    const idBook = findBorrowing.id_book;
    const dataBook = await ModelBooks.findById(idBook);

    const updateStock = {
      stock: dataBook.stock + 1,
    };

    await ModelBorrowing.findByIdAndUpdate(id, payload, { new: true });
    await ModelBooks.findByIdAndUpdate(idBook, updateStock, { new: true });

    Messages(res, 200, "Force Return Borrowing Succeed", findBorrowing);
  } catch (error) {
    Messages(res, 500, error?.message || "Internal server error");
  }
};

const forceReturnAllBorrowing = async (req, res) => {
  try {
    const findBorrowing = await ModelBorrowing.find({ isBorrow: 1 }).exec();
    if (!findBorrowing.length)
      return Messages(res, 404, `No books were borrowed`);

    const dataBook = await ModelBooks.find({ total_borrowed: { $gt: 0 } });

    const returnedTime = new Date();

    // filtering only late return date
    const filterDate = findBorrowing.filter(
      (item) => Date.parse(item.expected_return) < returnedTime
    );

    if (filterDate.length) {
      const updateDataUsers = findBorrowing.map(async (item) => {
        const lateCountData = await ModelUsers.find({
          _id: item.user._id,
        });

        lateCountData.forEach((property) => {
          property.late_return_count = property.late_return_count + 1;
        });

        const updateDataUser = lateCountData.map((element) => ({
          updateOne: {
            filter: { _id: new Types.ObjectId(element._id) },
            update: {
              $set: {
                late_return_count: element.late_return_count,
              },
            },
          },
        }));

        await ModelUsers.bulkWrite(updateDataUser);
      });

      await Promise.all(updateDataUsers);
    }

    dataBook.forEach((item) => {
      item.stock = item.stock + item.total_borrowed;
      item.total_borrowed = 0;
    });

    const updateDataBooks = dataBook.map((element) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(element._id) },
        update: {
          $set: {
            stock: element.stock,
            total_borrowed: element.total_borrowed,
          },
        },
      },
    }));

    const updateDataBorrowing = findBorrowing.map(async (item) => {
      const result = await ModelBorrowing.updateOne(
        { _id: item._id },
        { isBorrow: 0, returned_at: returnedTime },
        { new: true }
      );
      return result;
    });

    await ModelBooks.bulkWrite(updateDataBooks);
    await Promise.all(updateDataBorrowing);

    Messages(res, 200, "Force Return All Borrowings Succeed");
  } catch (error) {
    Messages(res, 500, error?.message || "Internal server error");
  }
};

export {
  createBorrowBooks,
  getAllDataBorrowing,
  returnBook,
  historyBorrowing,
  deleteDataBorrowing,
  detailBorrowing,
  forceReturnBorrowing,
  forceReturnAllBorrowing,
};
