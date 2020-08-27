import React, { Component } from "react";
import { useCookies } from "react-cookie";

export default function Login() {
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [email, updateEmail] = React.useState("");
  const [password, updatePassword] = React.useState("");
  const [cookies, setCookie, removeCookie] = useCookies(["live-site-jwt"]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasError(false);

    // Login via server
    fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: email,
        password,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        if (data.status == 1) {
          // Save JWT to cookie
          setCookie("live-site-jwt", data.access_token, { path: "/" });

          setHasError(false);
          setLoggedIn(true);
        } else {
          setHasError(true);
        }
      })
      .catch((e) => console.log(e));
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
        {hasError ? (
          <div className="alert alert-danger">Wrong username or password!</div>
        ) : null}
      </form>
    </div>
  );
}
