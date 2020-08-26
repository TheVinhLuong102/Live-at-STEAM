import React from "react";

export default function NavBar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <a className="navbar-brand">
        <img src="https://assets.steamforvietnam.net/live/assets/images/logo.svg"/>
      </a>
      <button
        className="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarSupportedContent"
        aria-controls="navbarSupportedContent"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarSupportedContent">
        <ul className="navbar-nav mr-auto">
          <li className="nav-item active">
            <a className="nav-link" href="#">
              Home <span className="sr-only">(current)</span>
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              Link
            </a>
          </li>
        </ul>
        <form className="form-inline my-2 my-lg-20" style={{"float": "right"}}>
          <input
            className="form-control mr-sm-2"
            type="search"
            placeholder="Type in an username..."
          />
          <button
            className="btn btn-outline-success my-2 my-sm-0"
            type="submit"
          >
            Login
          </button>
        </form>
      </div>
    </nav>
  );
}
