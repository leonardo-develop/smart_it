const express = require("express");
const path = require("path");
const session = require("express-session");
require("dotenv").config();
require("./config/db");

const pageRoutes = require("./routes/pages.routes");
const apiRoutes = require("./routes/index");
const { requireAuth } = require("./middlewares/auth");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.SESSION_SECRET) {
    throw new Error("Missing required environment variable: SESSION_SECRET");
}

const ROOT_DIR = path.join(__dirname, "..");
const frontendDirectories = [
    "landpage",
    "loginform",
    "studentinfo",
    "docprofile",
    "managecourse",
    "syllabus",
    "syllabus_dash",
    "labs",
    "maintenance",
    "honorboard",
    "teaminstructor",
    "instructor_members",
    "oficehours",
    "abspresent"
];

function serveFrontend(directory, protectedDirectory) {
    const directoryPath = path.join(ROOT_DIR, directory);
    const middleware = express.static(directoryPath);

    app.use(`/${directory}`, (req, res, next) => {
        if (protectedDirectory && req.path.endsWith(".html")) {
            return requireAuth(req, res, next);
        }

        next();
    }, middleware);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
    }
}));

app.use("/uploads", requireAuth, (req, res, next) => {
    res.setHeader("Content-Disposition", "attachment");
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
}, express.static(path.join(__dirname, "uploads")));

serveFrontend("landpage", false);
serveFrontend("loginform", false);
frontendDirectories
    .filter((directory) => !["landpage", "loginform"].includes(directory))
    .forEach((directory) => serveFrontend(directory, true));

app.use("/", pageRoutes);
app.use("/api", apiRoutes);

app.use((err, req, res, next) => {
    console.error("Request error:", err);
    if (res.headersSent) {
        return next(err);
    }

    res.status(err.statusCode || 400).json({
        success: false,
        message: "تعذر معالجة الطلب"
    });
});

app.listen(PORT, () => {
    console.log(`Server started working at port ${PORT}`);
});
