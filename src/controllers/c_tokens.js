import ModelTokens from "../models/m_tokens.js";
import ModelUsers from "../models/m_users.js";
import Messages from "../utils/messages.js";

const getAllTokens = async (req, res) => {
  const q = req.query.q ? req.query.q : "";
  const q2 = req.query.revoke;
  const q3 = req.query.token ? req.query.token : "";

  const sort_by = req.query.sort_by ? req.query.sort_by.toLowerCase() : "desc";
  const sort_key = sort_by === "asc" ? 1 : -1;

  const page = req.query.page ? parseInt(req.query.page) : 1;
  const per_page = req.query.per_page ? parseInt(req.query.per_page) : 25;

  const pages = page === 1 ? 0 : (page - 1) * per_page;

  try {
    const filter = {
      user_id: { $regex: q, $options: "i" },
      revoke: q2 ? { $eq: q2 } : { $exists: true },
      token: { $regex: q3, $options: "i" },
    };

    const total = await ModelTokens.countDocuments(filter);
    const data = await ModelTokens.find(filter)
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
    Messages(res, 500, error?.message || "Internal server error");
  }
};

const detailTokenData = async (req, res) => {
  const id = req.params.id;

  try {
    const findDataTokens = await ModelTokens.findById(id);
    if (!findDataTokens) return Messages(res, 404, `ID ${id} not found`);

    Messages(res, 200, `Detail Data ID: ${id}`, findDataTokens);
  } catch (error) {
    Messages(res, 500, error?.message || "Internal server error");
  }
};

const ForceLogoutSignedUser = async (req, res) => {
  const id = req.params.id;

  try {
    const findDataTokens = await ModelTokens.findById(id);
    if (!findDataTokens) return Messages(res, 404, `ID ${id} not found`);

    const findUser = await ModelUsers.findById(findDataTokens.user_id);

    if (findDataTokens.revoke === 1)
      return Messages(res, 412, `User: ${findUser.full_name} is not logged in`);

    const payload = {
      // token: null,
      revoke: 1,
    };

    await ModelTokens.findByIdAndUpdate(id, payload, { new: true });
    await ModelUsers.findByIdAndUpdate(
      findDataTokens.user_id,
      { token: null },
      { new: true }
    );

    Messages(res, 200, `Force Logout User: ${findUser.full_name} Succeed`);
  } catch (error) {
    Messages(res, 500, error?.message || "Internal server error");
  }
};

const ForceLogoutAllSignedUser = async (req, res) => {
  try {
    const findDataTokens = await ModelTokens.find({ revoke: 0 }).exec();
    if (!findDataTokens) return Messages(res, 404, `There's no logged user`);

    const updateDataTokens = findDataTokens.map(async (item) => {
      const result = await ModelTokens.updateOne(
        { _id: item._id },
        {
          revoke: 1,
          // token: null,
        },
        { new: true }
      );
      return result;
    });

    const findDataUsers = await ModelUsers.find({
      token: { $ne: null }, // $ne (not equal) will find value that not equal with the specified value
    }).exec();
    const updateDataUsers = findDataUsers.map(async (item) => {
      const result = await ModelUsers.updateOne(
        { _id: item._id },
        { token: null },
        { new: true }
      );
      return result;
    });

    await Promise.all(updateDataTokens);
    await Promise.all(updateDataUsers);

    Messages(res, 200, "Force Logout All Users Succeed");
  } catch (error) {
    Messages(res, 500, error?.message || "Internal server error");
  }
};

const deleteDataToken = async (req, res) => {
  const _id = req.params.id;

  try {
    const findDataTokens = await ModelTokens.findById(_id);
    if (!findDataTokens) Messages(res, 404, `ID: ${_id} not found`);

    await ModelTokens.deleteOne({ _id: _id });

    Messages(res, 200, `Delete Data Token Success`, findDataTokens);
  } catch (error) {
    Messages(res, 500, error?.message || "Internal Sever Error");
  }
};

export {
  getAllTokens,
  detailTokenData,
  ForceLogoutSignedUser,
  ForceLogoutAllSignedUser,
  deleteDataToken,
};
