const { Router } = require("express");
const router = Router();

const auth = require("./auth/app");
router.use("/", auth);

const adminArchive = require("./admin/archive/app");
router.use("/admin/archive", adminArchive);

const adminSubmission = require("./admin/submission/app");
router.use("/admin/submission", adminSubmission);

const student = require("./student/app");
router.use("/student",student);

const search = require("./search/app");
router.use("/search",search);

const organization = require("./Organization/app");
router.use("/organization", organization);

module.exports = router;
