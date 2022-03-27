const {nanoid} = require("nanoid");
const {PREV_MESSAGES, SEND_MESSAGE, NEW_MESSAGE, LOGIN} = require("../constants");
const Message = require('../models/Message');
const User = require('../models/User');

const activeConnections = {};

module.exports = async (ws, req) => {
  let id;

  if (activeConnections[id]) {
    ws.send(JSON.stringify({
      type: PREV_MESSAGES,
      messages: await Message.find().populate('author', '_id displayName'),
    }));
  }

  ws.on('message', async msg => {
    const decodedMessage = JSON.parse(msg);

    switch (decodedMessage.type) {
      case LOGIN:
        const user = await User.find({token: decodedMessage.token});
        if (user) {
          id = nanoid();
          console.log(`Client connected id=${id}`);
          activeConnections[id] = ws;

          ws.send(JSON.stringify({
            type: PREV_MESSAGES,
            messages: await Message.find().populate('author', '_id displayName'),
          }));
        } else {
          console.log('Access denied!');
        }
        break;
      case SEND_MESSAGE:
        if (activeConnections[id]) {
          const messageData = {
            text: decodedMessage.message.text,
            author: decodedMessage.message.author,
          };
          const message = new Message(messageData);
          await message.save();
          const savedMessage = await Message.find({_id: message._id}).populate('author', 'displayName');

          Object.keys(activeConnections).forEach( id => {
            const conn = activeConnections[id];
            conn.send(JSON.stringify({
              type: NEW_MESSAGE,
              message: savedMessage,
            }));
          });
          break;
        } else {
          break;
        }
      default:
        if (activeConnections[id]) {
          console.log(`Unknown type ${decodedMessage.type}`);
        } else {
          break;
        }
        break;
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected id=${id}`);
    if (activeConnections[id]) {
      delete activeConnections[id];
    }
  });
}