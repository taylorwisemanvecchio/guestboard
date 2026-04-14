package com.infratech.guestboard.ui.welcome

import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Bundle
import android.util.Log
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
        StreamingApp("YouTube", listOf("com.google.android.youtube.tv", "com.google.android.youtube")),
        StreamingApp("Hulu", listOf("com.hulu.livingroomplus", "com.hulu.plus")),
        StreamingApp("Disney+", listOf("com.disney.disneyplus")),
        StreamingApp("Prime Video", listOf("com.amazon.amazonvideo.livingroom", "com.amazon.avod")),
        StreamingApp("HBO Max", listOf("com.hbo.hbomax", "com.wbd.stream")),
        StreamingApp("Tubi", listOf("com.tubitv")),
        StreamingApp("Peacock", listOf("com.peacocktv.peacockandroid")),
        StreamingApp("Apple TV", listOf("com.apple.atve.androidtv.appletv")),
        StreamingApp("Spotify", listOf("com.spotify.tv.android", "com.spotify.music")),
        StreamingApp("Paramount+", listOf("com.cbs.ott", "com.cbs.app")),
        StreamingApp("Instagram", listOf("com.instagram.airwave", "com.instagram.android")),
        StreamingApp("Pluto TV", listOf("tv.pluto.android")),
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
            // Find the first installed package
            var resolvedPackage: String? = null
            for (pkg in app.packageNames) {
                if (isPackageInstalled(pm, pkg)) {
                    resolvedPackage = pkg
                    break
                }
            }

            // Skip apps that aren't installed
            if (resolvedPackage == null) return@forEach

            Log.d("AppsTab", "Found installed: ${app.name} -> $resolvedPackage")

            val itemView = LayoutInflater.from(requireContext())
                .inflate(R.layout.item_streaming_app, grid, false)

            val icon = itemView.findViewById<ImageView>(R.id.app_icon)
            val name = itemView.findViewById<TextView>(R.id.app_name)

            name.text = app.name

            try {
                val appIcon = pm.getApplicationIcon(resolvedPackage)
                icon.setImageDrawable(appIcon)
            } catch (_: PackageManager.NameNotFoundException) {
                icon.setImageResource(R.drawable.ic_tab_apps)
            }

            val launchPkg = resolvedPackage
            itemView.setOnClickListener {
                launchApp(launchPkg)
            }

            val params = GridLayout.LayoutParams().apply {
                width = 0
                height = GridLayout.LayoutParams.WRAP_CONTENT
                columnSpec = GridLayout.spec(GridLayout.UNDEFINED, 1, 1f)
            }
            grid.addView(itemView, params)
        }

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

    private fun isPackageInstalled(pm: PackageManager, packageName: String): Boolean {
        return try {
            pm.getPackageInfo(packageName, 0)
            true
        } catch (_: PackageManager.NameNotFoundException) {
            false
        }
    }

    private fun launchApp(packageName: String) {
        val pm = requireContext().packageManager

        // Try 1: Standard launch intent
        var intent = pm.getLaunchIntentForPackage(packageName)

        // Try 2: Leanback launch intent (for TV apps)
        if (intent == null) {
            intent = pm.getLeanbackLaunchIntentForPackage(packageName)
        }

        // Try 3: Build a manual launch intent from the manifest
        if (intent == null) {
            intent = Intent(Intent.ACTION_MAIN).apply {
                setPackage(packageName)
                addCategory(Intent.CATEGORY_LAUNCHER)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            // Verify it resolves
            val resolveInfo = pm.queryIntentActivities(intent, 0)
            if (resolveInfo.isEmpty()) {
                // Try with LEANBACK_LAUNCHER category
                intent = Intent(Intent.ACTION_MAIN).apply {
                    setPackage(packageName)
                    addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                val leanbackResolve = pm.queryIntentActivities(intent, 0)
                if (leanbackResolve.isEmpty()) {
                    Log.w("AppsTab", "Could not resolve any launch intent for $packageName")
                    return
                }
            }
        }

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
            startActivity(intent)
        } catch (e: Exception) {
            Log.e("AppsTab", "Failed to launch $packageName: ${e.message}")
        }
    }
}
