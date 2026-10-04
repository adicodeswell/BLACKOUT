package com.blackout.network.service;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

/**
 * An Android Foreground Service that prevents the OS from killing our
 * Network Engine while it runs in the background scanning for peers.
 */
public class MeshForegroundService extends Service {
    private static final String TAG = "MeshForegroundService";
    private static final String CHANNEL_ID = "blackout_mesh_channel";
    private static final int NOTIFICATION_ID = 999;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "Starting BLACKOUT Mesh Foreground Service...");
        
        Notification notification = new Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("BLACKOUT Mesh Active")
                .setContentText("Keeping the emergency network alive in the background.")
                .setSmallIcon(android.R.drawable.ic_dialog_info) // Placeholder icon
                .build();

        // 1. Promote this service to the foreground to avoid OS battery limits
        startForeground(NOTIFICATION_ID, notification);
        
        // 2. We would normally instantiate the AndroidNetworkEngine and start BLE here!
        
        return START_STICKY; // Restart if killed
    }

    @Override
    public void onDestroy() {
        Log.i(TAG, "Stopping BLACKOUT Mesh Foreground Service.");
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        // We do not use IPC binding for this service.
        return null; 
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "BLACKOUT Background Mesh",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Maintains background network connectivity.");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
}
