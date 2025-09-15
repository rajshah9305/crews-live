import React, { createContext, useContext, useEffect, useState } from 'react';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [socketId, setSocketId] = useState(null);
    const [lastMessage, setLastMessage] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // This line is the key change for the frontend.
        // It reads the WebSocket server URL from an environment variable.
        // This allows you to configure the URL without changing the code.
        const websocketUrl = process.env.REACT_APP_WEBSOCKET_URL;

        if (!websocketUrl) {
            console.error("REACT_APP_WEBSOCKET_URL is not defined. The application will not connect.");
            return;
        }

        console.log(`Attempting to connect to WebSocket at: ${websocketUrl}`);
        const newSocket = new WebSocket(websocketUrl);

        // Event handler for when the connection is successfully opened.
        newSocket.onopen = () => {
            console.log('WebSocket connection established.');
            setIsConnected(true);
        };

        // Event handler for incoming messages.
        newSocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('Received message:', message);
            // If the server sends our ID, we store it.
            if (message.type === 'ID') {
                setSocketId(message.id);
            } else {
                // Otherwise, it's a message from another user.
                setLastMessage(message);
            }
        };

        // Event handler for when the connection is closed.
        newSocket.onclose = () => {
            console.log('WebSocket connection closed.');
            setIsConnected(false);
        };

        // Event handler for any connection errors.
        newSocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        setSocket(newSocket);

        // The cleanup function is critical. It closes the connection
        // when the component is removed to prevent memory leaks.
        return () => {
            console.log('Closing WebSocket connection.');
            newSocket.close();
        };
    }, []); // The empty dependency array ensures this effect runs only once.

    // Function to send messages to the server.
    const sendMessage = (message) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
            console.log('Sent message:', message);
        } else {
            console.error('Cannot send message, WebSocket is not open.');
        }
    };

    // The value provided to all children components of this context.
    const value = {
        socket,
        socketId,
        lastMessage,
        sendMessage,
        isConnected, // Provide connection status to the rest of the app.
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

