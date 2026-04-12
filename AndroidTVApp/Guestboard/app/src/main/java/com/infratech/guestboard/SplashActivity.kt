package com.infratech.guestboard

import android.content.Intent
import android.os.Bundle
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.lifecycleScope
import com.infratech.guestboard.ui.pairing.PairingActivity
import com.infratech.guestboard.ui.welcome.WelcomeActivity
import com.infratech.guestboard.util.DataStoreManager
import kotlinx.coroutines.launch

class SplashActivity : FragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val dataStoreManager = DataStoreManager(applicationContext)

        lifecycleScope.launch {
            val token = dataStoreManager.getToken()
            val intent = if (token != null) {
                Intent(this@SplashActivity, WelcomeActivity::class.java)
            } else {
                Intent(this@SplashActivity, PairingActivity::class.java)
            }
            startActivity(intent)
            finish()
        }
    }
}
