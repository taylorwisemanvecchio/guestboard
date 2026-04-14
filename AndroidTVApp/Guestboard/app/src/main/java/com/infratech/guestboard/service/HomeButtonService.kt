package com.infratech.guestboard.service

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.util.Log
import android.view.KeyEvent
import android.view.accessibility.AccessibilityEvent
import com.infratech.guestboard.SplashActivity

class HomeButtonService : AccessibilityService() {

    companion object {
        private const val TAG = "HomeButtonService"
    }

    override fun onKeyEvent(event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_DOWN) {
            when (event.keyCode) {
                KeyEvent.KEYCODE_HOME -> {
                    Log.d(TAG, "Home button intercepted — launching Guestboard")
                    launchGuestboard()
                    return true // Consume the event
                }
            }
        }
        return super.onKeyEvent(event)
    }

    private fun launchGuestboard() {
        val intent = Intent(this, SplashActivity::class.java).apply {
            addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP
            )
        }
        startActivity(intent)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Not needed — we only use key event filtering
    }

    override fun onInterrupt() {
        Log.w(TAG, "Accessibility service interrupted")
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.i(TAG, "Home button service connected")
    }
}
