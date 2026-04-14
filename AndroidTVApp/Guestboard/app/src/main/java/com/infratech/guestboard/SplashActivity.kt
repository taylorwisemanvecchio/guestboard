package com.infratech.guestboard

import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.lifecycleScope
import com.infratech.guestboard.admin.GuestboardDeviceAdmin
import com.infratech.guestboard.service.DeviceCommandService
import com.infratech.guestboard.ui.pairing.PairingActivity
import com.infratech.guestboard.ui.welcome.WelcomeActivity
import com.infratech.guestboard.util.DataStoreManager
import kotlinx.coroutines.launch

class SplashActivity : FragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // If this is a Home press and the app is already running, just finish
        if (!isTaskRoot && intent.hasCategory(Intent.CATEGORY_HOME)) {
            finish()
            return
        }

        // Set up Device Owner policies (idempotent)
        if (GuestboardDeviceAdmin.isDeviceOwner(this)) {
            GuestboardDeviceAdmin.setupDeviceOwner(this)
            Log.i("SplashActivity", "Device Owner mode active")
        }

        // Start the command polling service
        try {
            startService(Intent(this, DeviceCommandService::class.java))
        } catch (e: Exception) {
            Log.w("SplashActivity", "Could not start service: ${e.message}")
        }

        val dataStoreManager = DataStoreManager(applicationContext)

        lifecycleScope.launch {
            val token = dataStoreManager.getToken()
            val intent = if (token != null) {
                Intent(this@SplashActivity, WelcomeActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                }
            } else {
                Intent(this@SplashActivity, PairingActivity::class.java)
            }
            startActivity(intent)
            finish()
        }
    }
}
