import { Router, type IRouter } from "express";
import healthRouter from "./health";
import widgetsRouter from "./widgets";

const router: IRouter = Router();

router.use(healthRouter);
router.use(widgetsRouter);

export default router;
