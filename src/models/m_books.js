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
    book_name: String,
    book_content: {
      author: String,
      description: String,
      content: String,
    },
    book_image: {
      url: String,
      cloudinary_id: String,
    },
    stock: Number,
    total_borrowed: Number,
  },
  schemaOptions
);

export default model("Books", BooksSchema);
