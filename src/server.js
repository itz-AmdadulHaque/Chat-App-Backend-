import "dotenv/config";
import express from "express";
import cors from "cors";
import { corsOptions } from "./config/corsOptions.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js"
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser"
const app = express();

// middleware
app.use(cors(corsOptions));
app.use(cookieParser())

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/chat", chatRoutes)

//page not found
app.use("*", (req, res) => {
  console.log("////Page not found")
  res.status(404).send("Page Not Found");
});

// catch all error
app.use((error, req, res, next) => {
  console.log("///////////////Error: \n", error);  // thrown error or custom error all handled
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Something went wrong",
  });
  next()
});

const PORT = process.env.PORT || 3000;

// after db  connect server start listening
connectDB()
  .then(() => {
    // sometime express app fail to connect db
    app.on("errror", (error) => {
      console.log("ERRR: ", error);
      throw error; // re-throws the error and catch handles it
    });

    // if everything ok then start server
    app.listen(process.env.PORT, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
