import multer from "multer";

const storage = multer.memoryStorage(); // IMPORTANT

export const upload = multer({ storage });