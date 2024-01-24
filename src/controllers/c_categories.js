import Messages from "../utils/messages.js";
import isValidator from "../utils/validator.js";
import ModelCategories from "../models/m_categories.js";

const getAllCategories = async (req, res) => {
  const q = req.query.q ? req.query.q : "";

  const sort_by = req.query.sort_by ? req.query.sort_by.toLowerCase() : "desc";
  const sort_key = sort_by === "asc" ? 1 : -1;

  const page = req.query.page ? parseInt(req.query.page) : 1;
  const per_page = req.query.per_page ? parseInt(req.query.per_page) : 25;

  const pages = page === 1 ? 0 : (page - 1) * per_page;

  try {
    const filter = { category_name: { $regex: q, $options: "i" } };

    const total = await ModelCategories.countDocuments(filter);
    const data = await ModelCategories.find(filter)
      .sort({ _id: sort_key })
      .skip(pages)
      .limit(per_page);

    Messages(
      res,
      200,
      "All Data",
      { ...data },
      {
        page,
        per_page,
        total,
      }
    );
  } catch (error) {
    Messages(res, 500, error.message || "Internal Server Error");
  }
};

const createCategory = async (req, res) => {
  const category_name = req.body.category_name;

  const rules = {
    category_name: "required|regex:/^[a-zA-Z ]*$/|min:3|max:20", // Regex alphabet and spaces only
  };

  try {
    await isValidator(
      { category_name },
      rules,
      {
        regex: "Special characters or number are not allowed",
      },
      async (err, status) => {
        if (!status) return Messages(res, 412, { ...err, status });

        const inputName = category_name.toLowerCase().trim();
        const filter = { category_name: { $regex: inputName, $options: "i" } };
        const isSameName = await ModelCategories.findOne(filter);

        if (isSameName)
          return Messages(
            res,
            400,
            `Category: ${inputName} has been registered on our system`
          );

        await new ModelCategories({ category_name: inputName }).save();

        Messages(res, 201, `Create category: ${inputName} success`);
      }
    );
  } catch (error) {
    Messages(res, 500, error.message || "Internal Server Error");
  }
};

const detailCategory = async (req, res) => {
  const id = req.params.id;

  try {
    const findCategory = await ModelCategories.findById(id);
    if (!findCategory) return Messages(res, 404, `Category ID ${id} not found`);

    Messages(res, 200, "Detail Data Category", findCategory);
  } catch (error) {
    Messages(res, 500, error?.message || "Internal server error");
  }
};

const updateCategory = async (req, res) => {
  const id = req.params.id;
  const category_name = req.body.category_name;

  const rules = {
    category_name: "required|regex:/^[a-zA-Z ]*$/|min:3|max:20", // Regex alphabet and spaces only
  };
  try {
    const findCategory = await ModelCategories.findById(id);
    if (!findCategory) return Messages(res, 404, `ID ${id} not found`);

    await isValidator(
      { category_name },
      rules,
      {
        regex: "Special characters or number are not allowed",
      },
      async (err, status) => {
        if (!status) return Messages(res, 412, { ...err, status });

        const inputName = category_name.toLowerCase().trim();
        const isSameName = await ModelCategories.findOne({
          category_name: inputName,
        });
        const currentName = findCategory.category_name !== inputName;

        if (inputName === findCategory.category_name)
          return Messages(res, 200, "Can't update with same category name");

        if (isSameName !== null && currentName)
          return Messages(
            res,
            400,
            `Category: ${inputName} has been registered on our system`
          );

        const payload = { category_name: inputName };
        const updateData = await ModelCategories.findByIdAndUpdate(
          id,
          payload,
          {
            new: true,
          }
        );

        Messages(
          res,
          200,
          `Update category name from ${findCategory.category_name} to ${inputName} success`,
          updateData
        );
      }
    );
  } catch (error) {
    Messages(res, 500, error?.message || "Internal server error");
  }
};

const deleteCategory = async (req, res) => {
  const id = req.params.id;

  try {
    const findCategory = await ModelCategories.findById(id);
    if (!findCategory) return Messages(res, 404, `ID category ${id} not found`);

    await ModelCategories.deleteOne({ _id: id });

    Messages(
      res,
      200,
      `Delete category: ${findCategory.category_name} success`
    );
  } catch (error) {
    Messages(res, 500, error?.messages || "Internal server error");
  }
};

export {
  getAllCategories,
  createCategory,
  detailCategory,
  updateCategory,
  deleteCategory,
};
