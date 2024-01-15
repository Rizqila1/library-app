import ModelRoles from "../models/m_roles.js";
import Messages from "../utils/messages.js";
import isValidator from "../utils/validator.js";

const createRole = async (req, res) => {
  const name = req.body.name;

  const rules = {
    name: "required|alpha|min:4|max:20",
  };

  try {
    await isValidator({ name }, rules, null, async (err, status) => {
      if (!status) return Messages(res, 412, { ...err, status });

      const inputName = name.toLowerCase().trim();
      const filter = { name: { $regex: inputName, $options: "i" } };
      const isSameName = await ModelRoles.findOne(filter);

      if (isSameName)
        return Messages(
          res,
          400,
          `${inputName} roles has been registered on our system`
        );

      await new ModelRoles({ name: inputName }).save();

      Messages(res, 201, `Create Role (${inputName}) Success`);
    });
  } catch (error) {
    Messages(res, 500, error?.messages || "Internal server error");
  }
};

const getAllRoles = async (req, res) => {
  try {
    const data = await ModelRoles.find();
    Messages(res, 200, "Get Data Roles", { ...data });
  } catch (error) {
    Messages(res, 200, error?.message || "Internal Sever Error");
  }
};

const getDetailRole = async (req, res) => {
  const id = req.params.id;

  try {
    const findData = await ModelRoles.findById(id);
    if (!findData) return Messages(res, 404, `ID ${id} not found`);

    Messages(res, 200, "Detail Data Role", findData);
  } catch (error) {
    Messages(res, 500, error?.messages || "Internal server error");
  }
};

const updateRole = async (req, res) => {
  const id = req.params.id;
  const name = req.body.name;

  const rules = {
    name: "required|alpha|min:4|max:20",
  };

  try {
    const findData = await ModelRoles.findById(id);
    if (!findData) return Messages(res, 404, `ID ${id} not found`);

    await isValidator({ name }, rules, null, async (err, status) => {
      if (!status) return Messages(res, 412, { ...err, status });

      const inputName = name.toLowerCase().trim();
      const filter = { name: { $regex: inputName, $options: "i" } };
      const isSameName = await ModelRoles.findOne(filter);
      const currentName = findData.name !== inputName;

      if (inputName === findData.name)
        return Messages(res, 200, "Can't update with same role name");

      if (isSameName && currentName)
        return Messages(
          res,
          400,
          `${inputName} role has been registered on our system`
        );

      const payload = { name: inputName };
      const updateData = await ModelRoles.findByIdAndUpdate(id, payload, {
        new: true,
      });

      Messages(
        res,
        200,
        `Update role name from ${findData.name} to ${inputName} success`,
        updateData
      );
    });
  } catch (error) {
    Messages(res, 500, error?.message || "Internal server error");
  }
};

const deleteRole = async (req, res) => {
  const id = req.params.id;

  try {
    const findData = await ModelRoles.findById(id);
    if (!findData) return Messages(res, 404, `ID ${id} not found`);

    await ModelRoles.deleteOne({ _id: id });

    Messages(res, 200, `Delete role: ${findData.name} success`);
  } catch (error) {
    Messages(res, 500, error?.messages || "Internal server error");
  }
};

export { createRole, getAllRoles, getDetailRole, updateRole, deleteRole };
