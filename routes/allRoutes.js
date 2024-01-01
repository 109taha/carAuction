const router = require("express").Router();
const adminRoutes = require("./adminRoutes");
const userRoutes = require("./userRoutes");
const emailRoutes = require("./emailRoutes");

router.use("/admin", adminRoutes);
router.use("/user", userRoutes);
router.use("/emails", emailRoutes);
router.get("/", (req, res) => {
  res.send("Hello from Pak Auto Zone Api");
});

module.exports = router;
