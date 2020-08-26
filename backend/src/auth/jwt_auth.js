import jwt from "jsonwebtoken";

export default function jwt_auth(req, res, next) {
    const authHeader  = req.headers['Authorization']
    const token = authHeader && authHeader.split(" ") // Bearer ....
    if (token == null) res.status(403).json({"error": "No access token provided"})

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
        if(err) return res.sendStatus(403).json({"error": "Invalid credentials"})
        req.user = user;
    })
}