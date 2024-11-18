const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Serve the UI HTML file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Webhook endpoint
app.post('/webhook', (req, res) => {
    const payload = JSON.parse(req.body.message);

    let message = "Unknown event type";

    // Check event type and format message accordingly
    if (payload.type === "com.getopensocial.cms.user.login" && payload.data && payload.data.user) {
        const userName = payload.data.user.displayName || "Unknown User";
        const userStatus = payload.data.user.status || "No status";
        const loginTime = payload.time || "Unknown time";
        const userRoles = payload.data.user.roles ? payload.data.user.roles.join(", ") : "No roles";

        message = `User ${userName} logged in at ${loginTime}.\nStatus: ${userStatus}\nRoles: ${userRoles}`;
    } else if (payload.type === "com.getopensocial.cms.event.create" && payload.data && payload.data.event) {
        const eventLabel = payload.data.event.label || "Unnamed Event";
        const eventStatus = payload.data.event.status || "No status";
        const eventAuthor = payload.data.event.author.displayName || "Unknown author";
        const startTime = payload.data.event.start || "Unknown start time";
        const endTime = payload.data.event.end || "Unknown end time";
        const eventLink = payload.data.event.href ? payload.data.event.href.canonical : "No link";

        message = `Event "${eventLabel}" created by ${eventAuthor}.\nStatus: ${eventStatus}\nStart: ${startTime}\nEnd: ${endTime}\nLink: ${eventLink}`;
    }

    console.log("Formatted message:", message);

    // Emit the formatted message to connected clients
    io.emit('webhook_message', message);

    res.status(200).send("Webhook received successfully");
});

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('A client connected');
    socket.on('disconnect', () => {
        console.log('A client disconnected');
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Webhook server is listening on http://localhost:${PORT}`);
});

