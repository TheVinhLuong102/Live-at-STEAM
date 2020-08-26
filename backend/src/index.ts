import express, { json } from 'express';
import bodyParser from 'body-parser';
import ChatServer from './chat_server/server';
import AuthenticationServer from './auth/authentication_server';
import {LocalUserManager} from './chat_server/member_manager';

require('dotenv').config();

const app = express();
app.use(bodyParser.json())

app.use(express.json());

type APIResponse = {
  status: number,
  response?: any,
  error?: string,
}

const user_manager = new LocalUserManager();

app.post('/login', (req, res) => {
  const username: string = req.body.username;
  const password: string = req.body.password;
  if(username == null || password == null) {
    return res.status(400).json({"error": "missing params"});
  }

  authenticationServer.login(username, password).then((response) => {
    user_manager.getState(username).then(async (userState) => {
      // if not registered
      if(!userState) {
        await user_manager.addUser(username).catch((e) => {
          console.error(e);
          return res.status(500).json({"error": "Failed to add new user!"});
        })
      }
      
      return res.json({
        status: 1,
        access_token: response
      } as APIResponse);
    });
  }).catch(error => res.status(500).json({
    status: -1,
    error
  } as APIResponse));

});

app.get('/api/getRooms', (req, res) => {
  myChatServer.getRooms().then((rooms) =>
    res.json({
      "status": 1,
      "response": rooms
    } as APIResponse)
  ).catch(e => res.status(500).json({
    status: -1,
    error: "something went wrong"
  } as APIResponse));
});

app.get('/admin/setMaxRooms', (req, res) => {

  if (!req.query.maxRooms) {
    return res.status(400).json({ status: -1, error: "missing params" } as APIResponse)
  }
  let maxRoom: number  = parseInt(req.query.maxRooms as string);
  myChatServer.setMaxNumRooms(maxRoom).then(() =>
    res.json({
      "status": 1,
      "response": `Successfully set maxRooms to ${maxRoom}`
    } as APIResponse)
  ).catch(e => res.status(500).json({
    status: -1,
    error: "something went wrong"
  } as APIResponse));
});

app.get('/admin/shuffleRooms', (req, res) => {
  myChatServer.shuffleIntoRooms().then(() =>
    res.json({
      "status": 1,
      "response": `Successfully shuffled clients to different rooms`
    } as APIResponse)
  ).catch(e => res.status(500).json({
    status: -1,
    error: "something went wrong"
  } as APIResponse));
});

// we build frontend app to the public folder
app.use(express.static('public'));

// fallback URL to redirect other requests to react app
app.get('*', function(req, res) {
  res.sendFile("/public/index.html", { root: __dirname });
});

const http_server = app.listen(process.env.PORT || 3600, () => console.log(`Server is listening on port ${process.env.PORT || 3600}`));

const myChatServer = new ChatServer(http_server, user_manager);
myChatServer.setup();

const authenticationServer = new AuthenticationServer();

module.exports = app;
