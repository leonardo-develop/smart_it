const express = require("express");
const path = require("path");
require("./config/db");

const pageRoutes = require("./routes/pages.routes");
const apiRoutes = require("./routes/index");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/managecourse", express.static("managecourse"));
app.use("/", pageRoutes);    
app.use("/api", apiRoutes);   
app.listen(PORT, () => {
    console.log(`Server started working at port ${PORT}`);
});
