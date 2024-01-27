import ModelBooks from "../models/m_books.js";
import ModelCategories from "../models/m_categories.js";
import Cloudinary from "../config/cloudinary.js";
import Messages from "../utils/messages.js";
import isValidator from "../utils/validator.js";

const addBook = async (req, res) => {
  const body = req.body;
  const file = req.file;

  const rules = {
    book_name: "required|regex:/^[a-zA-Z0-9 ]*$/|max:30", // Regex alphanumeric and spaces only
    category_id: "required|alpha_num",
    book_content: {
      author: "required|max:24|string",
      description: "required|max:1000",
      content: "required",
    },
    stock: "required|numeric",
  };

  try {
    if (!file) return Messages(res, 412, "Image required");

    await isValidator(
      { ...body },
      rules,
      {
        regex: "Special characters are not allowed",
      },
      async (err, status) => {
        if (!status) return Messages(res, 412, { ...err, status });

        try {
          const findCategory = await ModelCategories.findById(body.category_id);
          if (!findCategory) return Messages(res, 404, "Category not found");

          // upload image to cloudinary
          const result = await Cloudinary.uploader.upload(file.path);

          // assign data
          const payload = {
            ...body,

            book_name: body.book_name.trim(),
            category: {
              _id: findCategory._id,
              category_name: findCategory.category_name,
            },
            book_image: {
              url: result.secure_url,
              cloudinary_id: result.public_id,
            },
            stock: body.stock.trim(),
            total_borrowed: 0,
          };

          await new ModelBooks(payload).save();

          Messages(res, 201, "Add Book Success", payload);
        } catch (error) {
          Messages(res, 500, error?.message || "Internal Server Error");
        }
      }
    );
  } catch (error) {
    Messages(res, 500, error?.message || "Internal server error");
  }
};

const getAllDataBooks = async (req, res) => {
  const q = req.query.q ? req.query.q : "";
  const q2 = req.query.category_id;

  const sort_by = req.query.sort_by ? req.query.sort_by.toLowerCase() : "desc";
  const sort_key = sort_by === "asc" ? 1 : -1;

  const page = req.query.page ? parseInt(req.query.page) : 1;
  const per_page = req.query.per_page ? parseInt(req.query.per_page) : 25;

  const pages = page === 1 ? 0 : (page - 1) * per_page;

  try {
    const filter = {
      book_name: { $regex: q, $options: "i" },
      "category._id": q2 ? { $eq: q2 } : { $exists: true },
    };

    const total = await ModelBooks.countDocuments(filter);
    const data = await ModelBooks.find(filter)
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

const detailBookData = async (req, res) => {
  const id = req.params.id;

  try {
    const findBook = await ModelBooks.findById(id);
    if (!findBook) return Messages(res, 404, `Product ID ${id} not found`);

    Messages(res, 200, "Detail Data", findBook);
  } catch (error) {
    Messages(res, 500, error?.message || "Internal server error");
  }
};

const updateBook = async (req, res) => {
  const id = req.params.id;
  const body = req.body;
  const file = req.file;

  const rules = {
    book_name: "required|regex:/^[a-zA-Z0-9 ]*$/|max:30", // Regex alphanumeric and spaces only
    category_id: "required|alpha_num",
    book_content: {
      author: "required|max:24|string",
      description: "required|max:1000",
      content: "required",
    },
    stock: "required|numeric",
  };

  try {
    const findBook = await ModelBooks.findById(id);
    if (!findBook) return Messages(res, 404, `Book ID: ${id} not found`);

    await isValidator(
      { ...body },
      rules,
      { regex: "Special characters are not allowed" },
      async (err, status) => {
        if (!status) return Messages(res, 412, { ...err, status });

        let payload = {};

        try {
          const findCategory = await ModelCategories.findById(body.category_id);
          if (!findCategory) return Messages(res, 404, "Category not found");

          if (file) {
            const book_image = findBook._doc.book_image.url;
            const book_cloudinary_id = findBook._doc.book_image.cloudinary_id;

            // delete exist image
            if (book_image)
              await Cloudinary.uploader.destroy(book_cloudinary_id);

            // upload new image
            const result = await Cloudinary.uploader.upload(file.path);

            // assign data secure_url and public_id to key image
            payload.book_image = {
              url: result.secure_url,
              cloudinary_id: result.public_id,
            };
          }

          payload = {
            ...payload,
            ...body,
            book_name: body.book_name?.trim(),
            category: {
              _id: findCategory._id,
              category_name: findCategory.category_name,
            },
          };

          const newData = await ModelBooks.findByIdAndUpdate(
            id,
            { ...payload },
            { new: true }
          );

          Messages(res, 200, "Update book success", newData);
        } catch (error) {
          Messages(res, 500, error?.message || "Internal Server Error");
        }
      }
    );
  } catch (error) {
    Messages(res, 500, error?.message || "Internal server error");
  }
};

const deleteBook = async (req, res) => {
  const _id = req.params.id;

  try {
    const findBook = await ModelBooks.findById(_id);
    if (!findBook) return Messages(res, 404, "Book Not Found");

    const cloudinary_id = findBook._doc.book_image.cloudinary_id;

    if (cloudinary_id) await Cloudinary.uploader.destroy(cloudinary_id);

    await ModelBooks.deleteOne({ _id: _id });

    Messages(res, 200, `Delete Book (${findBook.book_name}) Success`);
  } catch (error) {
    Messages(res, 500, error?.message || "Internal Server Error");
  }
};

export { addBook, getAllDataBooks, detailBookData, updateBook, deleteBook };
