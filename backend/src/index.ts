
import express from 'express';
import ChatServer from './chat_server/server';

const app = express();

type APIResponse = {
  status: number,
  response?: string,
  error?: string,
}

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

app.get('/admin/setMaxRooms', (req, res) => {
  let maxRoom: Number | null | undefined = req.query.maxRooms;
  if (maxRoom == null) {
    res.status(400).json({ status: -1, error: "missing params" } as APIResponse)
  }
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


const http_server = app.listen(process.env.PORT || 3600, () => console.log(`Server is listening on port ${process.env.PORT || 3600}`));

const myChatServer = new ChatServer(http_server);
myChatServer.setup();

module.exports = app;
