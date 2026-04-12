package com.infratech.guestboard.ui.pairing

import android.os.Bundle
import androidx.fragment.app.FragmentActivity
import com.infratech.guestboard.R

class PairingActivity : FragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_pairing)

        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.pairing_container, PairingFragment())
                .commit()
        }
    }
}
