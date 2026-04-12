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
import com.bumptech.glide.Glide
import com.infratech.guestboard.R
import com.infratech.guestboard.data.model.DisplayPayload
import kotlinx.coroutines.launch

class WelcomeTabFragment : Fragment() {
    private val viewModel: WelcomeViewModel by activityViewModels()

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return inflater.inflate(R.layout.fragment_tab_welcome, container, false)
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
        view.findViewById<TextView>(R.id.property_name).text = payload.property.name

        val welcomeNote = view.findViewById<TextView>(R.id.welcome_note)

        if (payload.guest != null) {
            view.findViewById<TextView>(R.id.welcome_message).text = payload.guest.welcomeMessage

            if (!payload.guest.welcomeNote.isNullOrBlank()) {
                welcomeNote.visibility = View.VISIBLE
                welcomeNote.text = payload.guest.welcomeNote
            } else {
                welcomeNote.visibility = View.GONE
            }

            val badge = view.findViewById<TextView>(R.id.occasion_badge)
            if (payload.guest.occasion != null) {
                badge.visibility = View.VISIBLE
                badge.text = payload.guest.occasion.replaceFirstChar { it.uppercase() }
            } else {
                badge.visibility = View.GONE
            }
        } else {
            view.findViewById<TextView>(R.id.welcome_message).text = getString(R.string.welcome_no_guest)
            welcomeNote.visibility = View.GONE
            view.findViewById<TextView>(R.id.occasion_badge).visibility = View.GONE
        }

        val weatherSection = view.findViewById<LinearLayout>(R.id.weather_section)
        if (payload.settings.showWeather && payload.weather != null) {
            weatherSection.visibility = View.VISIBLE
            view.findViewById<TextView>(R.id.weather_temp).text = getString(R.string.weather_temp, payload.weather.temp)
            view.findViewById<TextView>(R.id.weather_desc).text = payload.weather.description.replaceFirstChar { it.uppercase() }
            val iconUrl = "https://openweathermap.org/img/wn/${payload.weather.icon}@2x.png"
            Glide.with(this).load(iconUrl).into(view.findViewById<ImageView>(R.id.weather_icon))
        } else {
            weatherSection.visibility = View.GONE
        }

        try {
            val accentColor = Color.parseColor(payload.settings.accentColor)
            view.findViewById<TextView>(R.id.property_name).setTextColor(accentColor)
        } catch (_: Exception) { }
    }
}
