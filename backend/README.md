## Installation

```text
npm install
```

## TODO

- ~~Implement basic chat with no authentication~~
- Setup signed JWT token for logged in user (independent from LMS)
    + Frontend client should make an API call to retrieve a signed JWT token.
        * The signed token should encode user data such as `username`, `permission`, `profile_pic`
    + That token would then be saved in Cookies and later on passed back to the server through socket creation. (Code pointer: https://github.com/steamforvietnam/Live-at-STEAM/blob/853fc4585812edccfea6a38f3d774d0b9d361fa6/frontend/src/Components/Chatbox.js#L32)
    + The Chatserver should utilize socketio middleware to verify that token on every new event.
- Implement a callback endpoint for LMS OAuth
    + The payload for this callback must contain LMS OAuth's signed token, which would be used for re-verifying user's login status.
    + The LMS OAuth's signed token should encode LMS's user info such as: `username` or `userid`, `role` or `privillage`, `profile_pic`, etc.



## Run

- `npm run start` to start development build. Nodemon should automatically rebuild the project on save.
