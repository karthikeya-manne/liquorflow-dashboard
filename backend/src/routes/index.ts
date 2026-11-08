import { Router } from "express";
import { shopsRouter } from "./shops.js";

export const apiRouter = Router();

apiRouter.use("/shops", shopsRouter);
