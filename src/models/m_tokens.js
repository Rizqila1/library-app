import connMongoose from "../config/mongoose.js";

const { model, Schema } = connMongoose;

const TokensSchema = new Schema({
  UUID_token: String,
  user_id: String,
  token: String,
  revoke: Number,
  expired_at: String,
  created_at: String,
});

export default model("Tokens", TokensSchema);
