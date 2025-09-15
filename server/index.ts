const WebSocket = require('ws');

// Define the allowed origins for CORS (Cross-Origin Resource Sharing)
// This ensures that only your frontend can connect to this server.
const ALLOWED_ORIGINS = [
  'https://crews-live.vercel.app', // Your Vercel deployment
  'http://localhost:3000',        // For local development
];

// Use the PORT environment variable provided by the hosting service (like Render),
// or default to 8080 for local development. This is crucial for deployment.
const PORT = process.env.PORT || 8080;

// Create a new WebSocket server.
// The `verifyClient` function acts as a security check for incoming connections.
const wss = new WebSocket.Server({
  port: PORT,
  verifyClient: (info, done) => {
    const origin = info.origin;
    // Check if the connection request is from an allowed domain.
    if (ALLOWED_ORIGINS.includes(origin)) {
      console.log(`Connection from origin ${origin} allowed.`);
      done(true); // Allow the connection
    } else {
      console.log(`Connection from origin ${origin} rejected.`);
      done(false, 403, 'Forbidden: Origin not allowed'); // Block the connection
    }
  }
});

// This object will store all active client connections, mapping a unique ID to each.
const clients = {};

// This function generates a simple, unique ID for each new client.
const getUniqueID = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return s4() + s4() + '-' + s4();
};

// Event listener for when a new client establishes a connection.
wss.on('connection', (ws) => {
  // 1. Assign a unique ID to the new client.
  const id = getUniqueID();
  clients[id] = ws;
  console.log(`New client connected with ID: ${id}`);

  // 2. Send the client its unique ID so it knows who it is.
  ws.send(JSON.stringify({ type: 'ID', id: id }));

  // 3. Set up a listener for messages from this specific client.
  ws.on('message', (rawMessage) => {
    console.log(`Received message from ${id}: ${rawMessage}`);
    try {
      const message = JSON.parse(rawMessage);
      const targetId = message.targetId;
      const targetClient = clients[targetId];

      // Check if the intended recipient is connected and ready to receive messages.
      if (targetClient && targetClient.readyState === WebSocket.OPEN) {
        // Forward the message, adding the sender's ID for context.
        targetClient.send(JSON.stringify({ ...message, senderId: id }));
        console.log(`Forwarded message from ${id} to ${targetId}`);
      } else {
        console.log(`Client with ID ${targetId} not found or not open.`);
        // Notify the sender that the recipient is not available.
        ws.send(JSON.stringify({ type: 'ERROR', message: `User ${targetId} is not connected.` }));
      }
    } catch (error) {
      console.error('Failed to parse or handle message:', error);
    }
  });

  // 4. Set up a listener for when this client disconnects.
  ws.on('close', () => {
    console.log(`Client with ID: ${id} has disconnected.`);
    // Clean up by removing the client from the active list.
    delete clients[id];
  });

  // 5. Set up a listener for any connection errors.
  ws.on('error', (error) => {
    console.error(`An error occurred for client ${id}:`, error);
  });
});

console.log(`WebSocket server is running on port ${PORT}`);

