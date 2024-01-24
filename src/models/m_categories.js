import connMongoose from "../config/mongoose.js";

const { model, Schema } = connMongoose;

const schemaOptions = {
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
};

const BooksSchema = new Schema(
  {
    category_name: String,
  },
  schemaOptions
);

export default model("Categories", BooksSchema);
