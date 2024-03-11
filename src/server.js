import "dotenv/config";
import express from "express";
import cors from "cors";
import { corsOptions } from "./config/corsOptions.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js"
import messageRoute from "./routes/message.route.js"
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser"
import {Server} from "socket.io"

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
app.use("/api/v1/messages", messageRoute)

//page not found
app.use("*", (req, res) => {
  console.log("////Invalid Route")
  res.status(404).send("Invalid Route");
});

// catch all error (including custom throw errors)
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
    const expressSever = app.listen(process.env.PORT, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });

    const io = new Server(expressSever, {
      cors:{ origin: '*' }
    });

    io.on("connection", (socket) => {
      console.log("//////////Connected to Socket io")

      // user active
      socket.on("setup", (userData)=>{
        socket.join(userData._id)
        // console.log(userData._id);
        socket.emit("connected")
      })

      // join chat
      socket.on("join chat", (room)=>{
        socket.join(room)
        console.log("User joined room: ", room)
      })

      // message
      socket.on("new message", (newMessage)=>{
        let chat = newMessage.chat

        if(!chat.users){
          console.log("chat users not defined")
          return;
        }

        chat.users.forEach((user)=>{
          if(user._id == newMessage.sender._id) return;

          socket.in(user._id).emit("message recieved", newMessage)
        })
      })

    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });


