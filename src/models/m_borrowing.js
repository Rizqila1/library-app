import connMongoose from "../config/mongoose.js";

const { model, Schema } = connMongoose;

const schemaOptions = {
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
};

const BorrowingSchema = new Schema(
  {
    user: {
      _id: String,
      full_name: String,
      email: String,
    },
    isBorrow: Number,
    id_book: String,
    book_name: String,
    time: String,
    expected_return: String,
    returned_at: String,
    book_image: {
      url: String,
      cloudinary_id: String,
    },
  },
  schemaOptions
);

export default model("Borrowing", BorrowingSchema);
