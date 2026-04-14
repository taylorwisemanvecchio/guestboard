package com.infratech.guestboard.service

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import com.infratech.guestboard.admin.GuestboardDeviceAdmin
import com.infratech.guestboard.admin.StreamingApps
import com.infratech.guestboard.data.api.RetrofitClient
import com.infratech.guestboard.data.model.CommandAck
import com.infratech.guestboard.util.DataStoreManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class DeviceCommandService : Service() {

    companion object {
        private const val TAG = "DeviceCommandService"
        private const val POLL_INTERVAL_MS = 30_000L // Check every 30 seconds
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val api = RetrofitClient.api

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "Command polling service started")
        scope.launch { pollLoop() }
        return START_STICKY // Restart if killed
    }

    private suspend fun pollLoop() {
        val dataStoreManager = DataStoreManager(applicationContext)

        while (true) {
            try {
                val token = dataStoreManager.getToken()
                if (token != null) {
                    val response = api.getCommands(token)
                    if (response.isSuccessful) {
                        val command = response.body()
                        if (command != null) {
                            Log.i(TAG, "Received command: ${command.command}")
                            executeCommand(command.command, token)
                        }
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Command poll failed: ${e.message}")
            }
            delay(POLL_INTERVAL_MS)
        }
    }

    private suspend fun executeCommand(command: String, token: String) {
        when (command) {
            "wipe_credentials" -> {
                Log.i(TAG, "Executing credential wipe")
                wipeStreamingCredentials()
                ackCommand(token, command, "completed")
            }
            else -> {
                Log.w(TAG, "Unknown command: $command")
                ackCommand(token, command, "failed")
            }
        }
    }

    private fun wipeStreamingCredentials() {
        if (!GuestboardDeviceAdmin.isDeviceOwner(applicationContext)) {
            Log.w(TAG, "Not device owner — attempting pm clear via shell fallback")
            // Fallback: try runtime exec (works if app has the right permissions)
            for (pkg in StreamingApps.WIPE_PACKAGES) {
                try {
                    val process = Runtime.getRuntime().exec(arrayOf("pm", "clear", pkg))
                    process.waitFor()
                    Log.i(TAG, "Shell cleared $pkg: exit=${process.exitValue()}")
                } catch (e: Exception) {
                    Log.w(TAG, "Shell clear failed for $pkg: ${e.message}")
                }
            }
            return
        }

        // Device Owner mode — use official API
        GuestboardDeviceAdmin.clearAppData(applicationContext, StreamingApps.WIPE_PACKAGES)
        Log.i(TAG, "Device Owner wipe complete for ${StreamingApps.WIPE_PACKAGES.size} apps")
    }

    private suspend fun ackCommand(token: String, command: String, status: String) {
        try {
            api.ackCommand(token, CommandAck(command = command, status = status))
            Log.i(TAG, "Acked command $command with status $status")
        } catch (e: Exception) {
            Log.w(TAG, "Failed to ack command: ${e.message}")
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        scope.cancel()
        Log.i(TAG, "Command polling service stopped")
    }
}
