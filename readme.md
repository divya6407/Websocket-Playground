# WebSocket Playground

**Real-time communication testing and experimentation platform**

A comprehensive WebSocket testing platform that allows developers to experiment with real-time bidirectional communication, test WebSocket functionality, and understand event-driven architecture patterns.

## 📋 Deep Dive

WebSocket Playground was created to provide developers with a hands-on environment to test and understand WebSocket communication without building a full application. WebSockets are essential for real-time features like chat applications, live updates, and collaborative tools, but they can be challenging to debug and test. This platform offers a visual interface to connect to WebSocket servers, send/receive messages, and analyze the communication flow. It serves as both a learning tool for those new to WebSockets and a testing utility for experienced developers implementing real-time features.

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd websocket-playground
```

2. **Server Setup**
```bash
cd server
npm install
```

3. **Client Setup**
```bash
cd ../client
npm install
```

### Environment Variables

**Server configuration** (in `index.js`):
```env
PORT=3000
```

**Client configuration** (in `vite.config.js`):
```env
VITE_SERVER_URL=http://localhost:3000
```

## 🛠️ Usage and Features

### Run Commands

**Server (Development):**
```bash
cd server
npm run dev
```

**Server (Production):**
```bash
cd server
npm start
```

**Client (Development):**
```bash
cd client
npm run dev
```

**Client (Production Build):**
```bash
cd client
npm run build
```

### Core Features

- **Real-Time Connection**: Live WebSocket connection management
- **Bidirectional Messaging**: Send and receive messages instantly
- **Event Tracking**: Monitor WebSocket events (connect, disconnect, error, message)
- **Message History**: Visual log of all communications
- **Connection Status**: Real-time connection state indicators
- **Custom Endpoints**: Support for different WebSocket endpoints
- **Room/Channel Support**: Test broadcasting and room-based messaging
- **Error Handling**: Comprehensive error detection and display
- **Material UI Interface**: Clean, modern interface with Material Design
- **Responsive Design**: Works on desktop and mobile devices

### Project Structure

```
websocket-playground/
├── server/
│   ├── index.js                    # Express + Socket.io server
│   ├── package.json
│   └── node_modules/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConnectionPanel.jsx  # Connection management
│   │   │   ├── MessageLog.jsx      # Message history display
│   │   │   ├── SendPanel.jsx       # Message input interface
│   │   │   └── StatusIndicator.jsx # Connection status
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Main playground interface
│   │   │   └── Rooms.jsx           # Room testing interface
│   │   ├── socket/
│   │   │   └── socket.js           # Socket.io client setup
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── WEBSOCKET-PLAYGROUND/           # Alternative implementation
│   ├── client/
│   └── server/
└── README.md
```

## 🧰 Tech Stack & Architecture

### Frontend
- **React 19** - UI library with modern hooks
- **Vite** - Fast build tool and dev server
- **Material UI (MUI)** - React component library
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io-client** - WebSocket client library
- **React Router** - Client-side routing
- **Axios** - HTTP client for REST API fallbacks

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.io** - WebSocket library with fallbacks
- **CORS** - Cross-origin resource sharing
- **ES6 Modules** - Modern JavaScript modules

### Real-Time Communication
- **Socket.io** - WebSocket wrapper with automatic fallbacks
- **Event-Driven Architecture** - Message passing through events
- **Room Management** - Channel-based communication
- **Broadcasting** - Send messages to all connected clients
- **Private Messaging** - Direct client-to-client communication

### System Design

```
┌─────────────┐
│   Frontend  │ (React + Socket.io Client)
└──────┬──────┘
       │ WebSocket Connection
       ↓
┌─────────────┐
│ Socket.io   │ (Connection Management)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Express   │ (HTTP Server)
│   Server    │ (Static Files)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Events    │ (Message Handling)
└──────┬──────┘
       │
       ├──────────────┐
       ↓              ↓
┌─────────────┐  ┌─────────────┐
│  Broadcast  │  │    Rooms    │
│  Messages   │  │  Channels   │
└─────────────┘  └─────────────┘
```

## 🔍 WebSocket Events

### Client to Server
```javascript
// Connect to server
socket.emit('join', { room: 'test-room' });

// Send message
socket.emit('message', { text: 'Hello World', room: 'test-room' });

// Private message
socket.emit('private', { to: 'user-id', text: 'Private message' });
```

### Server to Client
```javascript
// Broadcast to all
io.emit('broadcast', { text: 'Server announcement' });

// Send to room
io.to('test-room').emit('room-message', { text: 'Room specific' });

// Send to specific client
io.to(socketId).emit('private', { text: 'Private response' });
```

### Connection Events
```javascript
// Client events
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
socket.on('error', (err) => console.error('Error:', err));

// Server events
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
```

## 🧪 Testing Scenarios

### Basic Connection Test
1. Start the server
2. Open the client
3. Click "Connect"
4. Verify connection status changes to "Connected"

### Message Sending Test
1. Connect to the server
2. Type a message in the input field
3. Click "Send"
4. Verify message appears in the message log

### Room/Channel Test
1. Connect to the server
2. Join a specific room
3. Send messages to the room
4. Open another browser tab and join the same room
5. Verify messages are received in both tabs

### Error Handling Test
1. Start the server
2. Connect the client
3. Stop the server
4. Verify disconnection is detected
5. Restart the server
6. Verify reconnection works

## 📝 Notes

- **Fallback Support**: Socket.io automatically falls back to HTTP long-polling if WebSockets are not available
- **CORS Configuration**: Server configured to allow connections from specified origins
- **Connection Persistence**: Connections are maintained even during network interruptions
- **Scalability**: For production, consider using Redis adapter for multi-server deployments
- **Security**: Implement authentication and authorization for production use

## 🚀 Future Enhancements

- [ ] Authentication system for secure connections
- [ ] Message encryption for sensitive data
- [ ] File transfer support through WebSockets
- [ ] Video/audio streaming capabilities
- [ ] Connection statistics and analytics
- [ ] Load testing tools
- [ ] Protocol debugging tools
- [ ] Multi-server deployment examples
- [ ] Integration with other real-time services
- [ ] Mobile app version

## 🤝 Contributions & License

### Contribution Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### License
This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Contact

For questions or feedback about this project, please reach out via:
- **Email**: divyashree6407@gmail.com
- **LinkedIn**: https://linkedin.com/in/divya-shree-bb6b35331
- **GitHub**: https://github.com/divya6407

---

*Built with ❤️ using React, Node.js, Socket.io, and Material UI*