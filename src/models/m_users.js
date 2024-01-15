import connMongoose from "../config/mongoose.js";
const { model, Schema } = connMongoose;

const schemaOptions = {
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
};

const usersSchema = new Schema(
  {
    full_name: String,
    email: String,
    password: String,
    image: {
      url: String,
      cloudinary_id: String,
    },
    role: {
      _id: String,
      name: String,
    },
    token: String,
    late_return_count: Number,
    isActive: Number,
  },
  schemaOptions
);

export default model("Users", usersSchema);
