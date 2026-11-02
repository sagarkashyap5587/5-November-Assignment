import { Router } from "express";

import { groupController } from "./group.controller.js";
import { createGroupSchema } from "./dto/create-group.dto.js";
import { updateGroupSchema } from "./dto/update-group.dto.js";
import { addMemberSchema } from "./dto/add-member.dto.js";
import {
  groupMemberParamsSchema,
  groupParamsSchema,
} from "./dto/group-params.dto.js";

import { redisProvider } from "../../../providers/redis/redis.provider.js";
import { groupRepository } from "../../../repositories/group.repository.js";
import { accessTokenMiddleware } from "../../../middlewares/accessToken.middleware.js";
import { groupMemberMiddleware } from "../../../middlewares/groupMember.middleware.js";
import {
  validateBody,
  validateParams,
} from "../../../middlewares/validate.middleware.js";

const groupRoutes = Router();

const redisClient = redisProvider.getClient();

const memberOnly = groupMemberMiddleware((groupId, userId) =>
  groupRepository.isMember(groupId, userId),
);

// Every group route requires a valid access token.
groupRoutes.use(accessTokenMiddleware(redisClient));

groupRoutes.post("/", validateBody(createGroupSchema), groupController.create);

groupRoutes.get("/", groupController.list);

groupRoutes.get(
  "/:groupId",
  validateParams(groupParamsSchema),
  memberOnly,
  groupController.get,
);

groupRoutes.patch(
  "/:groupId",
  validateParams(groupParamsSchema),
  memberOnly,
  validateBody(updateGroupSchema),
  groupController.rename,
);

groupRoutes.post(
  "/:groupId/members",
  validateParams(groupParamsSchema),
  memberOnly,
  validateBody(addMemberSchema),
  groupController.addMember,
);

groupRoutes.delete(
  "/:groupId/members/:userId",
  validateParams(groupMemberParamsSchema),
  memberOnly,
  groupController.removeMember,
);

export default groupRoutes;