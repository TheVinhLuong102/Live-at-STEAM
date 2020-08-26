import React, { Component } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
//@ts-ignore
import { Button } from '@gotitinc/design-system';

export default function Login() {
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

    // Save JWT to cookie
    setCookie(
      "openedx-jwt",
      "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOiAxNTk4NDcyMTUyLCAiYXVkIjogIm9wZW5lZHgiLCAiaXNzIjogImh0dHA6Ly9jb3Vyc2VzLnN0ZWFtZm9ydmlldG5hbS5vcmcvb2F1dGgyIiwgImVtYWlsIjogInRhc2guZmFzbUBnbWFpbC5jb20iLCAiZmlsdGVycyI6IFsidXNlcjptZSJdLCAiaXNfcmVzdHJpY3RlZCI6IGZhbHNlLCAidmVyc2lvbiI6ICIxLjIuMCIsICJmYW1pbHlfbmFtZSI6ICIiLCAiaWF0IjogMTU5ODQzNjE1MiwgInN1YiI6ICJhN2QxMjhlMjI2ZDhkMWViMzk2NzcyYjM2MDAxZTcxOSIsICJwcmVmZXJyZWRfdXNlcm5hbWUiOiAidGFzaC1mYXNtIiwgInN1cGVydXNlciI6IGZhbHNlLCAiYWRtaW5pc3RyYXRvciI6IGZhbHNlLCAiZ2l2ZW5fbmFtZSI6ICIiLCAibmFtZSI6ICJUdWFuIEFuaCBQaGFtIiwgImVtYWlsX3ZlcmlmaWVkIjogdHJ1ZSwgInNjb3BlcyI6IFsicHJvZmlsZSIsICJlbWFpbCIsICJyZWFkIiwgIndyaXRlIl19.cl0hOtUddFMfQ2DFuB133yb_ri1cl-Y2INnPqAUb_UU",
      { path: "/" }
    );
  };

  const logOut = () => {
    removeCookie("openedx-jwt", { path: "/" });
  }

  return (
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
        <Button type="submit">Login</Button>
      </form>
      <button className="btn btn-outline-danger my-2 my-sm-0" onClick={logOut}>
        Logout
      </button>
    </div>
  );
}
