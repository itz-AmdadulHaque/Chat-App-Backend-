import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    name: {
      type: "String",
      required: true,
    },
    email: {
      type: "String",
      unique: true,
      required: true,
    },
    password: {
      type: "String",
      required: true,
    },
    pic: {
      type: "String",
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestaps: true }
);

// hook(mongoose middleware) to hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) { 
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// methods to a schema, and these methods become available on the instances of
// the model (documents) that you retrieve from the MongoDB database.
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export { User };
