import {
  SEED_USER_ADMIN_EMAIL,
  SEED_USER_ADMIN_PASSWORD,
  SEED_USER_MANAGER_EMAIL,
  SEED_USER_MANAGER_PASSWORD,
} from "../config/secret.js";

import ModelRoles from "../models/m_roles.js";
import ModelUsers from "../models/m_users.js";
import bcrypt from "bcrypt";

// SEEDING DB IS TO CREATE DATA AUTOMATICALLY IF THERE'S NONE
// USEFUL WHEN WE ARE GOING TO DO DEPLOYMENT
// IN THIS APP, ONLY SEEDING FOR ROLE & USER DATA

export default async function () {
  const findDataRole = await ModelRoles.find();
  if (!findDataRole.length) {
    const payload = [{ name: "manager" }, { name: "admin" }, { name: "user" }];
    await ModelRoles.create(payload);
  }

  const findDataUsers = await ModelUsers.find();
  if (!findDataUsers.length) {
    const findRoleManager = await ModelRoles.findOne({ name: "manager" });
    const findRoleAdmin = await ModelRoles.findOne({ name: "admin" });

    const inputEmailManager = SEED_USER_MANAGER_EMAIL;
    const inputPasswordManager = SEED_USER_MANAGER_PASSWORD;

    // hash password manager
    const salt = bcrypt.genSaltSync(10);
    const passwordManager = bcrypt.hashSync(inputPasswordManager, salt);

    const createAccountManager = {
      full_name: "Readist Manager",
      email: inputEmailManager,
      password: passwordManager,
      role: {
        _id: findRoleManager._id,
        name: findRoleManager.name,
      },
      token: null,
      late_return_count: 0,
      isActive: 1,
    };

    const inputEmailAdmin = SEED_USER_ADMIN_EMAIL;
    const inputPasswordAdmin = SEED_USER_ADMIN_PASSWORD;

    // hash password admin
    const salt2 = bcrypt.genSaltSync(10);
    const passwordAdmin = bcrypt.hashSync(inputPasswordAdmin, salt2);

    const createAccountAdmin = {
      full_name: "Readist Admin",
      email: inputEmailAdmin,
      password: passwordAdmin,
      role: {
        _id: findRoleAdmin._id,
        name: findRoleAdmin.name,
      },
      token: null,
      late_return_count: 0,
      isActive: 1,
    };

    await ModelUsers.create(createAccountManager);
    await ModelUsers.create(createAccountAdmin);
  }
}
