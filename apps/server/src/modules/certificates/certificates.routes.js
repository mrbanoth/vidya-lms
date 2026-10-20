import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import * as c from "./certificates.controller.js";

const r = Router();
r.get("/mine", authenticate, c.mine);
r.get("/verify/:code", c.verify);
r.get("/:code/pdf", c.pdf);
export default r;
