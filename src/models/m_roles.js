import connMongoose from "../config/mongoose.js";
const { model, Schema } = connMongoose;

const schemaOptions = {
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
};

const roleSchema = new Schema(
  {
    name: String,
  },
  schemaOptions
);

export default model("Roles", roleSchema);
