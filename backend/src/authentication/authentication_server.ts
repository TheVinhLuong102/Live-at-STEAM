import axios from "axios";
import querystring from "querystring";

export default class AuthenticationServer {
    async login(username: string, password: string): Promise<void> {
        const apiBaseUrl = "https://courses.steamforvietnam.org";
        const payload = {
            username,
            password,
            grant_type: "password",
            client_id: "",
            client_secret: "",
            token_type: "jwt"
        };
        const query = querystring.stringify(payload);
        return axios.post(
            apiBaseUrl + `/oauth2/access_token/?${query}`
        ).then((response) => {
            console.log(response.data);
        })
        .catch((e) => console.log("error", e.response.data));
    }
}