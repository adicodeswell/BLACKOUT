package com.blackout.network.transport;

import android.util.Log;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;

/**
 * A background server that listens for incoming TCP connections from other BLACKOUT peers.
 */
public class NetworkServer {
    private static final String TAG = "NetworkServer";
    
    private final int port;
    private final ServerListener listener;
    
    private ServerSocket serverSocket;
    private Thread acceptThread;
    private volatile boolean isRunning = false;

    public interface ServerListener {
        void onSocketAccepted(Socket socket);
    }

    public NetworkServer(int port, ServerListener listener) {
        this.port = port;
        this.listener = listener;
    }

    public synchronized void start() throws IOException {
        if (isRunning) return;
        
        serverSocket = new ServerSocket(port);
        isRunning = true;

        acceptThread = new Thread(() -> {
            Log.i(TAG, "NetworkServer started on port " + port);
            while (isRunning && !serverSocket.isClosed()) {
                try {
                    // This blocks until a peer connects
                    Socket clientSocket = serverSocket.accept();
                    Log.i(TAG, "Accepted incoming connection from: " + clientSocket.getInetAddress());
                    
                    if (listener != null) {
                        listener.onSocketAccepted(clientSocket);
                    }
                } catch (IOException e) {
                    if (isRunning) {
                        Log.e(TAG, "Error accepting connection", e);
                    }
                }
            }
            Log.i(TAG, "NetworkServer stopped.");
        }, "NetworkServer-AcceptThread");
        
        acceptThread.start();
    }

    public synchronized void stop() {
        isRunning = false;
        try {
            if (serverSocket != null && !serverSocket.isClosed()) {
                serverSocket.close();
            }
        } catch (IOException e) {
            Log.e(TAG, "Error closing ServerSocket", e);
        }
        if (acceptThread != null) {
            acceptThread.interrupt();
        }
    }
}
