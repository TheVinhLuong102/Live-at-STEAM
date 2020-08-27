import jwt from 'jsonwebtoken';
import UserManager, {Role, UserState} from "../chat_server/member_manager";

export async function verifyTokenAndGetUserState(token: string): Promise<UserState>{
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user: {name: string}) => {
            if(err) {
                console.error(err);
                return reject("Failed to verify JWT Token");
            }
            UserManager.getState(user.name).then(async (userState) => {
                // if not registered
                if(!userState) {
                    UserManager.addUser(user.name).then((userState) => {
                        resolve(userState);
                    }).catch((e) => {
                        console.error(e);
                        reject(new Error("Failed to add new user"));
                    });
                } else {
                    resolve(userState);
                }
            });
        });
    });
}

export function check_admin(req, res, next) {
    if(req.user.role != Role.ADMIN)
        return res.status(401).json({"error": "Permission denied"});
    next();
}

export function jwt_express_auth(req, res, next) {
    console.log(req.headers)
    const authHeader  = req.headers['authorization'];
    const authCookie = req.cookies['authorization'];
    const token = (authHeader && authHeader.split(" ")[1] ) || authCookie;
    if (token == null) return res.status(403).json({"error": "No access token provided"});

    verifyTokenAndGetUserState(token).catch((e) => {
        if(e instanceof String)
            res.status(403).json({"error": e});
        else
            res.status(500).json({"error": "Something went wrong"});
    }).then(userState => {
        console.log(userState);
        req.user = userState;
        next();
    })
}