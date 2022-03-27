const {nanoid} = require("nanoid");
const {PREV_MESSAGES, SEND_MESSAGE, NEW_MESSAGE, LOGIN, PREV_USERS, NEW_USER} = require("../constants");
const Message = require('../models/Message');
const User = require('../models/User');

const activeConnections = {};
const activeUsers = [];

module.exports = async (ws, req) => {
  let id;

  ws.on('message', async msg => {
    const decodedMessage = JSON.parse(msg);

    switch (decodedMessage.type) {
      case LOGIN:
        const user = await User.find({token: decodedMessage.user.token}).select('displayName');
        if (user) {
          id = nanoid();
          console.log(`Client connected id=${id}`);
          activeConnections[id] = ws;

          ws.send(JSON.stringify({
            type: PREV_USERS,
            users: activeUsers,
          }));

          Object.keys(activeConnections).forEach(id => {
            const conn = activeConnections[id];
            conn.send(JSON.stringify({
              type: NEW_USER,
              user: {user: user[0], connId: id},
            }));
          });

          activeUsers.push({user: user[0], connId: id});

          ws.send(JSON.stringify({
            type: PREV_MESSAGES,
            messages: await Message.find().sort({_id: -1})
              .populate('author', '_id displayName').limit(30),
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

          Object.keys(activeConnections).forEach(id => {
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
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected id=${id}`);
    if (activeConnections[id]) {
      delete activeConnections[id];
      const index = activeUsers.map(object => object.connId).indexOf(id);
      activeUsers.splice(index, 1);

      Object.keys(activeConnections).forEach(id => {
        const conn = activeConnections[id];
        conn.send(JSON.stringify({
          type: PREV_USERS,
          users: activeUsers,
        }));
      });
    }
  });
}