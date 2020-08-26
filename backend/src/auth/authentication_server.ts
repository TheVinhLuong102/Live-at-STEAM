import axios from "axios";
import querystring from "querystring";
import jwt from 'jsonwebtoken';

export default class AuthenticationServer {
  async login(username: string, password: string): Promise < string > {
    const apiBaseUrl = process.env.LMS_BASE_URL;

    const payload = {
      username,
      password,
      grant_type: "password",
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      token_type: "jwt"
    };
    const query = querystring.stringify(payload);

    return new Promise((resolve, reject) => {
      axios.post(
          apiBaseUrl + `/oauth2/access_token/`,
          query,
        ).then((response) => {
          const user = jwt.decode(response.data.access_token)?.preferred_username;
          if (!user) {
            reject("Invalid JWT token received");
          }

          resolve(jwt.sign({name: username}, process.env.JWT_SECRET_KEY));
        })
        .catch((e) => reject(e.message));
    });
  }
}