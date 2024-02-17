import multer from "multer";

// seperate file from text data and save the file in disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // store file in the location
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); //file name when save (make it unique later)
  },
});

export const upload = multer({
  storage,
});