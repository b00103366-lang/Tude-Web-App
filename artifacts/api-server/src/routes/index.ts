import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import authRouter from "./auth";
import usersRouter from "./users";
import professorsRouter from "./professors";
import classesRouter from "./classes";
import enrollmentsRouter from "./enrollments";
import gradesRouter from "./grades";
import notificationsRouter from "./notifications";
import transactionsRouter from "./transactions";
import reviewsRouter from "./reviews";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/professors", professorsRouter);
router.use("/classes", classesRouter);
router.use("/enrollments", enrollmentsRouter);
router.use("/grades", gradesRouter);
router.use("/notifications", notificationsRouter);
router.use("/transactions", transactionsRouter);
router.use("/payments", transactionsRouter);
router.use("/reviews", reviewsRouter);
router.use("/stats", statsRouter);

export default router;
