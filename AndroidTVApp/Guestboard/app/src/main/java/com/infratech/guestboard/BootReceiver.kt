package com.infratech.guestboard

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.infratech.guestboard.service.DeviceCommandService

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val bootActions = setOf(
            Intent.ACTION_BOOT_COMPLETED,
            "android.intent.action.QUICKBOOT_POWERON"
        )
        if (intent.action in bootActions) {
            // Start the command polling service
            context.startService(Intent(context, DeviceCommandService::class.java))

            // Launch the app
            val launchIntent = Intent(context, SplashActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
            context.startActivity(launchIntent)
        }
    }
}
