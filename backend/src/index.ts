
import express from 'express';
import ChatServer from './chat_server/server';

const app = express();

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

const http_server = app.listen(process.env.PORT || 3600, () => console.log(`Server is listening on port ${process.env.PORT || 3600}`));

const myChatServer = new ChatServer(http_server);
myChatServer.setup();

module.exports = app;
