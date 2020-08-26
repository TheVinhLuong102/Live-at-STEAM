import React, { Component } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";

export default function Login() {
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [email, updateEmail] = React.useState("");
  const [password, updatePassword] = React.useState("");
  const [cookies, setCookie, removeCookie] = useCookies(["openedx-jwt"]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(email, password);

    // Login via server
    // axios.post("http://localhost:3600/login", {
    //   username: email,
    //   password
    // });

    // If success

    // Save JWT to cookie
    setCookie(
      "live-site-jwt",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoidGFzaC5mYXNtQGdtYWlsLmNvbSIsImlhdCI6MTU5ODQ4MzE2MH0.vwcnCfTcXIiKY54KnmxdbXEPedoDxCZ2GunvuSsFuK8",
      { path: "/" }
    );

    setLoggedIn(true);
  };

  const logOut = () => {
    removeCookie("live-site-jwt", { path: "/" });

    setLoggedIn(false);
  };

  return loggedIn ? (
    <button className="btn btn-outline-danger my-2 my-sm-0" onClick={logOut}>
      Logout
    </button>
  ) : (
    <div>
      <form
        onSubmit={handleSubmit}
        className="form-inline my-2 my-lg-20"
        style={{ float: "right" }}
      >
        <input
          className="form-control mr-sm-2"
          type="text"
          value={email}
          onChange={(e) => updateEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          className="form-control mr-sm-2"
          type="password"
          value={password}
          onChange={(e) => updatePassword(e.target.value)}
          placeholder="Password"
        />
        <button className="btn btn-outline-success my-2 my-sm-0" type="submit">
          Login
        </button>
      </form>
    </div>
  );
}
