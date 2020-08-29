import React, { Component } from "react";
import { useCookies } from "react-cookie";
//@ts-ignore
import { Form, Button, Dropdown, Icon } from '@gotitinc/design-system';

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

  React.useEffect(() => {
    const token = cookies["live-site-jwt"];

    if (token) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }

  }, [cookies["live-site-jwt"]])

  return loggedIn ? (
    <React.Fragment>
      <div className="u-marginRightExtraSmall">Username</div>
      <Dropdown alignRight id="profile">
        <Dropdown.Toggle className="u-textLight u-lineHeightNone">
          <Icon name="contact" size="medium" />
        </Dropdown.Toggle>
        <Dropdown.Container className="u-paddingVerticalExtraSmall">
          <Dropdown.Item role="button" onClick={logOut} id="header-logout-button">
            <Icon name="power" size="small" />
            <span className="u-marginLeftExtraSmall">Đăng xuất</span>
          </Dropdown.Item>
        </Dropdown.Container>
      </Dropdown>
    </React.Fragment>
  ) : (
    <React.Fragment>
      <Form.Input
        type="text"
        placeholder="Email"
        className="u-marginRightExtraSmall"
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEmail(e.target.value)}
        isInvalid={hasError}
      />
      <Form.Input
        type="password"
        placeholder="Mật khẩu"
        className="u-marginRightExtraSmall"
        value={password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePassword(e.target.value)}
        isInvalid={hasError}
      />
      <Button variant="accent" onClick={handleSubmit}>
        <Button.Label className="u-textDark u-textNoWrap">Đăng nhập</Button.Label>
      </Button>
      {/* TODO */}
      {hasError && (
        <Form.Feedback type="invalid" visible>Sai username hoặc mật khẩu!</Form.Feedback>
      )}
    </React.Fragment>
  );
}
