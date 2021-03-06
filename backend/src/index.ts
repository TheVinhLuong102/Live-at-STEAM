import express, { json } from "express";
import bodyParser from "body-parser";
import ChatServer from "./chat_server/server";
import jwt from "jsonwebtoken";
import AuthenticationServer from "./auth/authentication_server";
import cookieParser from "cookie-parser";
import UserManager, { Role, UserStatus } from "./chat_server/member_manager";
import {
  jwt_express_auth,
  check_admin,
  DecodedUserData,
} from "./auth/jwt_auth";
import { InMemoryKeyValueStorage } from "./storage/key_value";

require("dotenv").config();

const app = express();
app.use(bodyParser.json());

app.use(express.json());
app.use(cookieParser());

type APIResponse = {
  status: number;
  response?: any;
  error?: string;
};

app.post("/login", (req, res) => {
  const username: string = req.body.username;
  const password: string = req.body.password;
  if (username == null || password == null) {
    return res.status(400).json({ error: "missing params" });
  }

  authenticationServer
    .login(username, password)
    .then((response) => {
      UserManager.getState(response.preferred_username).then(
        async (userState) => {
          // if not registered
          if (!userState) {
            userState = await UserManager.addUser(
              response.preferred_username
            ).catch((e) => {
              console.error(e);
              return null;
            });

            if (!userState)
              return res.status(500).json({ error: "Failed to add new user!" });
          }
          return res.json({
            status: 1,
            access_token: jwt.sign(
              {
                username: userState.username,
                role: userState.role,
                isBanned: userState.status === UserStatus.BANNED,
              } as DecodedUserData,
              process.env.JWT_SECRET_KEY
            ),
          } as APIResponse);
        }
      );
    })
    .catch((error) =>
      res.status(400).json({
        status: -1,
        error,
      } as APIResponse)
    );
});

app.get("/api/getRooms", (req, res) => {
  myChatServer
    .getRooms()
    .then((rooms) =>
      res.json({
        status: 1,
        response: rooms,
      } as APIResponse)
    )
    .catch((e) =>
      res.status(500).json({
        status: -1,
        error: "something went wrong",
      } as APIResponse)
    );
});

app.get("/admin/setMaxRooms", (req, res) => {
  if (!req.query.maxRooms) {
    return res
      .status(400)
      .json({ status: -1, error: "missing params" } as APIResponse);
  }
  let maxRoom: number = parseInt(req.query.maxRooms as string);
  myChatServer
    .setMaxNumRooms(maxRoom)
    .then(() =>
      res.json({
        status: 1,
        response: `Successfully set maxRooms to ${maxRoom}`,
      } as APIResponse)
    )
    .catch((e) =>
      res.status(500).json({
        status: -1,
        error: "something went wrong",
      } as APIResponse)
    );
});

app.get("/admin/unban", [jwt_express_auth, check_admin], (req, res) => {
  if (!req.query.target_user) {
    return res
      .status(400)
      .json({ status: -1, error: "missing params" } as APIResponse);
  }
  let target_user: string = req.query.target_user;
  UserManager.unbanUser(target_user)
    .then(() => {
      res.json({
        status: 1,
        response: `Successfully unbanned ${target_user}`,
      } as APIResponse);
      myChatServer.emitUnbanMessage(target_user).catch((e) => console.error(e));
    })
    .catch((e) =>
      res.status(500).json({
        status: -1,
        error: "something went wrong",
      } as APIResponse)
    );
});

app.get("/admin/ban", [jwt_express_auth, check_admin], (req, res) => {
  if (!req.query.target_user) {
    return res
      .status(400)
      .json({ status: -1, error: "missing params" } as APIResponse);
  }
  let target_user: string = req.query.target_user;
  UserManager.banUser(target_user)
    .then(() => {
      res.json({
        status: 1,
        response: `Successfully banned ${target_user}`,
      } as APIResponse);
      myChatServer.emitBanMessage(target_user).catch((e) => console.error(e));
    })
    .catch((e) =>
      res.status(500).json({
        status: -1,
        error: "something went wrong",
      } as APIResponse)
    );
});

/**
 * GET /api/report?target_user={username}
 */
app.get("/api/report", [jwt_express_auth], (req, res) => {
  if (!req.query.target_user) {
    return res
      .status(400)
      .json({ status: -1, error: "missing params" } as APIResponse);
  }
  let target_user: string = req.query.target_user;
  UserManager.reportUser(target_user).then(() => {
    return res.json({
      status: 1,
      response: `User ${target_user} has been reported.`,
    } as APIResponse);
  });
});

app.get("/admin/shuffleRooms", (req, res) => {
  myChatServer
    .shuffleIntoRooms()
    .then(() =>
      res.json({
        status: 1,
        response: `Successfully shuffled clients to different rooms`,
      } as APIResponse)
    )
    .catch((e) =>
      res.status(500).json({
        status: -1,
        error: "something went wrong",
      } as APIResponse)
    );
});

// we build frontend app to the public folder
app.use(express.static("public"));

// fallback URL to redirect other requests to react app
app.get("*", function (req, res) {
  res.sendFile("public/index.html", { root: __dirname });
});

const http_server = app.listen(process.env.PORT || 3600, () =>
  console.log(`Server is listening on port ${process.env.PORT || 3600}`)
);

const myChatServer = new ChatServer(http_server, new InMemoryKeyValueStorage());
myChatServer.setup();

const authenticationServer = new AuthenticationServer();

module.exports = app;
