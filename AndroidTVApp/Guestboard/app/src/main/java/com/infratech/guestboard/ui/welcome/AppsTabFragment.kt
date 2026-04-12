package com.infratech.guestboard.ui.welcome

import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.GridLayout
import android.widget.ImageView
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import com.infratech.guestboard.R

class AppsTabFragment : Fragment() {
    private val viewModel: WelcomeViewModel by activityViewModels()

    data class StreamingApp(val name: String, val packageNames: List<String>)

    private val apps = listOf(
        StreamingApp("Netflix", listOf("com.netflix.ninja", "com.netflix.mediaclient")),
        StreamingApp("YouTube", listOf("com.google.android.youtube.tv", "com.google.android.youtube", "com.google.android.apps.youtube.tv")),
        StreamingApp("Hulu", listOf("com.hulu.livingroomplus", "com.hulu.plus")),
        StreamingApp("Disney+", listOf("com.disney.disneyplus")),
        StreamingApp("Prime Video", listOf("com.amazon.amazonvideo.livingroom", "com.amazon.avod")),
        StreamingApp("HBO Max", listOf("com.hbo.hbomax", "com.wbd.stream")),
        StreamingApp("Peacock", listOf("com.peacocktv.peacockandroid")),
        StreamingApp("Apple TV", listOf("com.apple.atve.androidtv.appletv")),
        StreamingApp("Spotify", listOf("com.spotify.tv.android", "com.spotify.music")),
        StreamingApp("Paramount+", listOf("com.cbs.ott", "com.cbs.app"))
    )

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return inflater.inflate(R.layout.fragment_tab_apps, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val state = viewModel.uiState.value
        if (state is DisplayUiState.Loaded) {
            try {
                val accentColor = Color.parseColor(state.payload.settings.accentColor)
                view.findViewById<TextView>(R.id.apps_title)?.setTextColor(accentColor)
            } catch (_: Exception) { }
        }

        val grid = view.findViewById<GridLayout>(R.id.apps_grid)
        grid.removeAllViews()

        val pm = requireContext().packageManager

        apps.forEach { app ->
            // Try each package name, use the first one that resolves
            var launchIntent: android.content.Intent? = null
            var resolvedPackage: String? = null
            for (pkg in app.packageNames) {
                val intent = pm.getLaunchIntentForPackage(pkg)
                if (intent != null) {
                    launchIntent = intent
                    resolvedPackage = pkg
                    break
                }
            }

            // Skip apps that aren't installed
            if (launchIntent == null) return@forEach

            val itemView = LayoutInflater.from(requireContext())
                .inflate(R.layout.item_streaming_app, grid, false)

            val icon = itemView.findViewById<ImageView>(R.id.app_icon)
            val name = itemView.findViewById<TextView>(R.id.app_name)

            name.text = app.name

            try {
                val appIcon = pm.getApplicationIcon(resolvedPackage!!)
                icon.setImageDrawable(appIcon)
            } catch (_: PackageManager.NameNotFoundException) {
                icon.setImageResource(R.drawable.ic_tab_apps)
            }

            itemView.setOnClickListener {
                startActivity(launchIntent)
            }

            val params = GridLayout.LayoutParams().apply {
                width = 0
                height = GridLayout.LayoutParams.WRAP_CONTENT
                columnSpec = GridLayout.spec(GridLayout.UNDEFINED, 1, 1f)
            }
            grid.addView(itemView, params)
        }

        // If no apps installed at all, show a message
        if (grid.childCount == 0) {
            val emptyText = TextView(requireContext()).apply {
                text = "No streaming apps installed"
                setTextColor(resources.getColor(R.color.text_secondary, null))
                textSize = 18f
            }
            val params = GridLayout.LayoutParams().apply {
                columnSpec = GridLayout.spec(0, grid.columnCount)
            }
            grid.addView(emptyText, params)
        }
    }
}
