import { Router } from "express";

import authRoutes from "./auth/auth.routes.js";
import userRoutes from "./user/user.routes.js";
import groupRoutes from "./group/group.routes.js";

const v1Routes = Router();

v1Routes.use("/auth", authRoutes);
v1Routes.use("/users", userRoutes);
v1Routes.use("/groups", groupRoutes);

export default v1Routes;
