import jwt from "jsonwebtoken";
import UserManager, { Role, UserState } from "../chat_server/member_manager";

export type DecodedUserData = {
  username: string;
};

export async function verifyTokenAndGetUserState(
  token: string
): Promise<UserState> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      process.env.JWT_SECRET_KEY,
      (err, userdata: DecodedUserData) => {
        if (err) {
          console.error(err);
          return reject("Failed to verify JWT Token");
        }
        UserManager.getState(userdata.username).then(async (userState) => {
          // if not registered
          if (!userState) {
            userState = await UserManager.addUser(userdata.username).catch(
              (e) => {
                console.error(e);
                return null;
              }
            );

            if (!userState) return reject("Failed to add new user!");
          }

          return resolve(userState);
        });
      }
    );
  });
}

export function check_admin(req, res, next) {
  if (req.user.role != Role.ADMIN)
    return res.status(401).json({ error: "Permission denied" });
  next();
}

export function jwt_express_auth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const authCookie = req.cookies["live-site-jwt"];
  const token = (authHeader && authHeader.split(" ")[1]) || authCookie;
  if (token == null)
    return res.status(403).json({ error: "No access token provided" });

  verifyTokenAndGetUserState(token)
    .catch((e) => {
      if (e instanceof String) res.status(403).json({ error: e });
      else res.status(500).json({ error: "Something went wrong" });
    })
    .then((userState) => {
      console.log(userState);
      req.user = userState;
      next();
    });
}
