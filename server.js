const express = require("express");
const multer = require("multer");
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const app = express();
const uploadsDir = path.join(__dirname, "uploads");
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (allowedTypes.has(file.mimetype)) return callback(null, true);
    callback(new Error("Разрешены только JPEG, PNG и WebP."));
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.post("/upload", upload.single("photo"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Фото не получено." });

    const extension = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp"
    }[req.file.mimetype];
    const filename = `${randomUUID()}${extension}`;

    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, filename), req.file.buffer, { flag: "wx" });
    res.json({ message: "Фото отправлено." });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Фото должно быть не больше 5 МБ." });
  }
  if (error.message === "Разрешены только JPEG, PNG и WebP.") {
    return res.status(415).json({ error: error.message });
  }
  console.error(error);
  res.status(500).json({ error: "Не удалось сохранить фото на сервере." });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Сервер запущен: http://localhost:${port}`);
});
