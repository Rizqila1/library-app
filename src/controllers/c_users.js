import ModelUsers from "../models/m_users.js";
import ModelRoles from "../models/m_roles.js";
import Messages from "../utils/messages.js";
import isValidator from "../utils/validator.js";
import { SECRET_KEY_JWT } from "../config/secret.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ModelTokens from "../models/m_tokens.js";
import { v4 as uuidv4 } from "uuid";
import Cloudinary from "../config/cloudinary.js";

const GetAllDataUsers = async (req, res) => {
  const q = req.query.q ? req.query.q : "";

  const sort_by = req.query.sort_by ? req.query.sort_by.toLowerCase() : "desc";
  const sort_key = sort_by === "asc" ? 1 : -1;

  const page = req.query.page ? parseInt(req.query.page) : 1;
  const per_page = req.query.per_page ? parseInt(req.query.per_page) : 25;

  const pages = page === 1 ? 0 : (page - 1) * per_page;

  try {
    const filter = { full_name: { $regex: q, $options: "i" } };

    const total = await ModelUsers.countDocuments(filter);
    const data = await ModelUsers.find(filter)
      .sort({ _id: sort_key })
      .skip(pages)
      .limit(per_page);

    // delete/hide property password
    const newData = data.map((item) => {
      delete item._doc.password;
      return {
        ...item._doc,
      };
    });

    Messages(
      res,
      200,
      "All Data",
      { ...newData },
      {
        page,
        per_page,
        total,
      }
    );
  } catch (error) {
    Messages(res, 500, error?.message || "Internal server error");
  }
};

const registerUser = async (req, res) => {
  const body = req.body;

  const rules = {
    full_name: "required|regex:/^[a-zA-Z ]*$/|min:3|max:24", // Regex alphabet and spaces only
    email: "required|email",
    password: "required|min:8|max:16|alpha_num",
  };

  await isValidator(
    body,
    rules,
    {
      regex: "This field must be alphabet only",
      alpha_num: "Password cannot contain special characters",
    },
    async (err, status) => {
      const pass = body.password;

      if (!status) return Messages(res, 412, { ...err, status });

      const findByEmail = await ModelUsers.findOne({ email: body.email });
      if (findByEmail) return Messages(res, 400, "Email has been registered");

      const findRole = await ModelRoles.findOne({ name: "user" });
      if (!findRole) Messages(res, 404, "Role not found");

      // hash password
      const salt = bcrypt.genSaltSync(10);
      const password = bcrypt.hashSync(body.password, salt);

      if (pass.match(/[A-Z]/)) {
        await new ModelUsers({
          ...body,

          password,
          role: {
            _id: findRole.id,
            name: findRole.name,
          },
          late_return_count: 0,
          isActive: 1,
        }).save();

        Messages(res, 201, "Register Succeed", body);
      } else {
        Messages(res, 400, "Password must be has at least 1 capital letter");
      }
    }
  );
};

const loginUser = async (req, res) => {
  const body = req.body;

  const rules = {
    email: "required|email",
    password: "required",
  };

  try {
    await isValidator(body, rules, null, async (err, status) => {
      if (!status) return Messages(res, 412, { ...err, status });

      const findByEmail = await ModelUsers.findOne({ email: body.email });
      if (!findByEmail) return Messages(res, 400, "Email not registered");
      if (findByEmail.isActive === 0)
        return Messages(
          res,
          403,
          "Your account is being deactivated, please contact admin for more information"
        );

      // compare password bcrypt
      const isHashPassword = findByEmail.password;
      const comparePassword = bcrypt.compareSync(body.password, isHashPassword);

      if (!comparePassword)
        return Messages(res, 400, "Wrong Password, please check again");

      // Create date for Tokens table
      function addHoursToDate(date, hours) {
        return new Date(new Date(date).setHours(date.getHours() + hours));
      }
      const date = new Date();
      const createdTime = date;
      const expiredTokenTime = addHoursToDate(date, 2);

      // variable id
      const id = findByEmail.id;

      // encode jsonwebtoken
      const payload = {
        _id: findByEmail.id,
        id_token: uuidv4(),
        role: {
          _id: findByEmail.role._id,
          name: findByEmail.role.name,
        },
        full_name: findByEmail.full_name,
        email: findByEmail.email,
      };
      const token = jwt.sign(payload, SECRET_KEY_JWT, { expiresIn: "2h" });

      await ModelUsers.findByIdAndUpdate(id, { token }, { new: true });

      const payloadModelTokens = {
        UUID_token: payload.id_token,
        user_id: id,
        token: token,
        revoke: 0,
        expired_at: expiredTokenTime,
        created_at: createdTime,
      };

      await new ModelTokens(payloadModelTokens).save();

      // finally
      Messages(res, 200, "Login Success", {
        _id: id,
        id_token: payload.id_token,
        token,
        role: { ...findByEmail.role },
      });
    });
  } catch (error) {
    Messages(res, 500, error?.message || "Internal Server Error");
  }
};

const logoutUser = async (req, res) => {
  const dataUser = { ...res.user };
  const dataToken = { ...res.token };
  const UUID_token = dataToken.id_token;

  try {
    const findUser = await ModelUsers.findById(dataUser._id);
    if (!findUser) return Messages(res, 404, "User Not Found");

    const payloadModelTokens = {
      // token: null,
      revoke: 1,
    };

    // Update data signed user from Tokens table
    await ModelTokens.findOneAndUpdate({ UUID_token }, payloadModelTokens, {
      new: true,
    });

    const payload = { token: null };
    await ModelUsers.findByIdAndUpdate(dataUser._id, payload, { new: true });

    Messages(res, 200, "Logout Success");
  } catch (error) {
    Messages(res, 500, error?.message || "Internal Server Error");
  }
};

const detailUser = async (req, res) => {
  const id = req.params.id;

  try {
    const findUser = await ModelUsers.findById(id);
    if (!findUser) return Messages(res, 404, "User Not Found");

    delete findUser._doc.password;

    Messages(res, 200, "Detail Data", findUser);
  } catch (error) {
    Messages(res, 500, error?.message || "Internal Server Error");
  }
};

const updateUser = async (req, res) => {
  const id = req.params.id;
  const body = req.body;
  const file = req.file;

  const rules = {
    full_name: "regex:/^[a-zA-Z ]*$/|min:3|max:24", // Regex alphabet and spaces only
  };

  try {
    const findUser = await ModelUsers.findById(id);
    if (!findUser) return Messages(res, 404, "User Not Found");
    if (findUser.full_name === body.full_name)
      return Messages(res, 412, "Can't change your name with the same name");

    await isValidator(
      body,
      rules,
      { regex: "This field must be alphabet only" },
      async (err, status) => {
        if (!status) return Messages(res, 412, { ...err, status });

        let payload = {};

        if (file) {
          const user_image = findUser._doc.image.url;
          const user_cloudinary_id = findUser._doc.image.cloudinary_id;

          if (user_image) await Cloudinary.uploader.destroy(user_cloudinary_id);

          // upload image to cloudinary
          const result = await Cloudinary.uploader.upload(file.path);

          // assign data secure_url & public_id to key image
          payload.image = {
            url: result.secure_url,
            cloudinary_id: result.public_id,
          };
        }

        payload = {
          ...payload,
          ...body,
          full_name: req.body.full_name?.trim(),
        };

        const newData = await ModelUsers.findByIdAndUpdate(id, payload, {
          new: true,
        });

        delete newData._doc.password;

        Messages(res, 200, "Update Success", newData);
      }
    );
  } catch (error) {
    Messages(res, 500, error?.message || "Internal Server Error");
  }
};

const activateUser = async (req, res) => {
  const id = req.params.id;

  try {
    const findUser = await ModelUsers.findById(id);
    if (!findUser) return Messages(res, 404, "User Not Found");

    if (findUser.isActive === 1)
      Messages(res, 412, "User is already in active status");

    await ModelUsers.updateOne({ _id: id }, { isActive: 1 }, { new: true });
    Messages(
      res,
      200,
      `Activate user: ${findUser.full_name}, role: ${findUser.role.name} success`
    );
  } catch (error) {
    Messages(res, 500, error?.message || "Internal Server Error");
  }
};

const deactivateUser = async (req, res) => {
  const id = req.params.id;

  try {
    const findUser = await ModelUsers.findById(id);
    if (!findUser) return Messages(res, 404, "User Not Found");

    if (findUser.isActive === 0)
      Messages(res, 412, "User is already in non-active status");

    await ModelUsers.updateOne({ _id: id }, { isActive: 0 }, { new: true });
    Messages(
      res,
      200,
      `Deactivate user: ${findUser.full_name}, role: ${findUser.role.name} success`
    );
  } catch (error) {
    Messages(res, 500, error?.message || "Internal Server Error");
  }
};

const deleteUser = async (req, res) => {
  const id = req.params.id;

  try {
    const findUser = await ModelUsers.findById(id);
    if (!findUser) return Messages(res, 404, "User Not Found");

    const user_image = findUser._doc.image?.url;
    const user_cloudinary_id = findUser._doc.image?.cloudinary_id;

    if (user_image) await Cloudinary.uploader.destroy(user_cloudinary_id);

    await ModelUsers.deleteOne({ _id: id });

    Messages(
      res,
      200,
      `Delete User: ${findUser.full_name} (${findUser.role.name}) Success`
    );
  } catch (error) {
    Messages(res, 500, error?.message || "Internal Server Error");
  }
};

export {
  GetAllDataUsers,
  registerUser,
  loginUser,
  logoutUser,
  detailUser,
  updateUser,
  activateUser,
  deactivateUser,
  deleteUser,
};
