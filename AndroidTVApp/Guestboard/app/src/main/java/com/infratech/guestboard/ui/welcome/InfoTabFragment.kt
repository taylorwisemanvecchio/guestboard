package com.infratech.guestboard.ui.welcome

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.infratech.guestboard.R
import com.infratech.guestboard.data.model.DisplayPayload
import com.infratech.guestboard.util.DateUtils
import com.infratech.guestboard.util.QrUtils
import kotlinx.coroutines.launch

class InfoTabFragment : Fragment() {
    private val viewModel: WelcomeViewModel by activityViewModels()

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return inflater.inflate(R.layout.fragment_tab_info, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    if (state is DisplayUiState.Loaded) bindData(view, state.payload)
                }
            }
        }
    }

    private fun bindData(view: View, payload: DisplayPayload) {
        // Host contact
        val hasContact = payload.property.hostName != null || payload.property.hostPhone != null || payload.property.hostEmail != null
        view.findViewById<View>(R.id.section_contact).visibility = if (hasContact) View.VISIBLE else View.GONE
        view.findViewById<TextView>(R.id.host_name).apply {
            text = payload.property.hostName ?: ""
            visibility = if (payload.property.hostName != null) View.VISIBLE else View.GONE
        }
        view.findViewById<TextView>(R.id.host_phone).apply {
            text = payload.property.hostPhone ?: ""
            visibility = if (payload.property.hostPhone != null) View.VISIBLE else View.GONE
        }
        view.findViewById<TextView>(R.id.host_email).apply {
            text = payload.property.hostEmail ?: ""
            visibility = if (payload.property.hostEmail != null) View.VISIBLE else View.GONE
        }
        view.findViewById<View>(R.id.divider1).visibility = if (hasContact) View.VISIBLE else View.GONE

        // WiFi
        val wifiSection = view.findViewById<LinearLayout>(R.id.wifi_section)
        val wifiDivider = view.findViewById<View>(R.id.wifi_divider)
        if (payload.settings.showWifi && payload.property.wifiName != null) {
            wifiSection.visibility = View.VISIBLE
            wifiDivider.visibility = View.VISIBLE
            view.findViewById<TextView>(R.id.wifi_name).text = payload.property.wifiName
            view.findViewById<TextView>(R.id.wifi_password).text = payload.property.wifiPassword ?: ""

            // Generate WiFi QR code
            val wifiQr = view.findViewById<ImageView>(R.id.wifi_qr)
            try {
                val qrBitmap = QrUtils.generateWifiQr(
                    payload.property.wifiName!!,
                    payload.property.wifiPassword
                )
                wifiQr.setImageBitmap(qrBitmap)
                wifiQr.visibility = View.VISIBLE
            } catch (_: Exception) {
                wifiQr.visibility = View.GONE
            }
        } else {
            wifiSection.visibility = View.GONE
            wifiDivider.visibility = View.GONE
        }

        // Dates
        val datesSection = view.findViewById<LinearLayout>(R.id.dates_section)
        if (payload.settings.showCheckout && payload.guest != null) {
            datesSection.visibility = View.VISIBLE
            view.findViewById<TextView>(R.id.checkin_date).text = DateUtils.formatDateNice(payload.guest.checkIn)
            view.findViewById<TextView>(R.id.checkout_date).text = DateUtils.formatDateNice(payload.guest.checkOut)
        } else {
            datesSection.visibility = View.GONE
        }

        // Apply accent color to section headers
        try {
            val accentColor = Color.parseColor(payload.settings.accentColor)
            view.findViewById<TextView>(R.id.section_contact).setTextColor(accentColor)
        } catch (_: Exception) { }
    }
}
