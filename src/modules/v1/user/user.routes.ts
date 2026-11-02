import { Router } from "express";

import { userController } from "./user.controller.js";
import { updateProfileSchema } from "./dto/update-profile.dto.js";

import { redisProvider } from "../../../providers/redis/redis.provider.js";
import { accessTokenMiddleware } from "../../../middlewares/accessToken.middleware.js";
import { validateBody } from "../../../middlewares/validate.middleware.js";

const userRoutes = Router();

const redisClient = redisProvider.getClient();

// Every user route requires a valid access token.
userRoutes.use(accessTokenMiddleware(redisClient));

userRoutes.get("/me", userController.getMe);

userRoutes.patch(
  "/me",
  validateBody(updateProfileSchema),
  userController.updateMe
);

userRoutes.get("/search", userController.search);

export default userRoutes;