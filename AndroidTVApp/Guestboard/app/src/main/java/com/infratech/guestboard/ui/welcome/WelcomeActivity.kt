package com.infratech.guestboard.ui.welcome

import android.content.Intent
import android.content.res.ColorStateList
import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.bumptech.glide.Glide
import com.infratech.guestboard.R
import com.infratech.guestboard.admin.GuestboardDeviceAdmin
import com.infratech.guestboard.data.model.DisplayPayload
import com.infratech.guestboard.ui.pairing.PairingActivity
import kotlinx.coroutines.launch

class WelcomeActivity : FragmentActivity() {
    private lateinit var viewModel: WelcomeViewModel
    private lateinit var backgroundImage: ImageView
    private lateinit var backgroundDim: View
    private lateinit var mainContent: View
    private lateinit var loadingView: View
    private lateinit var loadingSpinner: View
    private lateinit var loadingText: TextView
    private lateinit var loadingSubtext: TextView
    private lateinit var bottomNav: LinearLayout

    private lateinit var logoImage: ImageView
    private lateinit var clockOverlay: View
    private lateinit var clockDate: TextView
    private lateinit var clockTime: TextView
    private val clockHandler = Handler(Looper.getMainLooper())
    private val dateFormat = SimpleDateFormat("EEEE, MMMM d", Locale.US)
    private val timeFormat = SimpleDateFormat("h:mm a", Locale.US)

    private var currentTabIndex = -1 // -1 = no tab shown yet
    private val navItems = mutableListOf<View>()
    private var dataLoaded = false
    private var accentColor: Int? = null

    // Cache fragments so we don't recreate them every switch
    private val fragmentCache = mutableMapOf<Int, Fragment>()

    // Debounce tab switching
    private var lastTabSwitchTime = 0L
    private val TAB_SWITCH_DEBOUNCE_MS = 200L

    data class TabInfo(val label: String, val iconRes: Int, val fragmentFactory: () -> Fragment)

    private val tabs by lazy {
        listOf(
            TabInfo("Welcome", R.drawable.ic_tab_home) { WelcomeTabFragment() },
            TabInfo("Info", R.drawable.ic_tab_info) { InfoTabFragment() },
            TabInfo("Nearby", R.drawable.ic_tab_nearby) { NearbyTabFragment() },
            TabInfo("Apps", R.drawable.ic_tab_apps) { AppsTabFragment() }
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        setContentView(R.layout.activity_welcome)

        // Start lock task mode — Home button becomes no-op, streaming apps still work
        if (GuestboardDeviceAdmin.isDeviceOwner(this)) {
            GuestboardDeviceAdmin.startLockTask(this)
        }

        backgroundImage = findViewById(R.id.background_image)
        backgroundDim = findViewById(R.id.background_dim)
        mainContent = findViewById(R.id.main_content)
        loadingView = findViewById(R.id.loading_view)
        loadingSpinner = findViewById(R.id.loading_spinner)
        loadingText = findViewById(R.id.loading_text)
        loadingSubtext = findViewById(R.id.loading_subtext)
        bottomNav = findViewById(R.id.bottom_nav)
        logoImage = findViewById(R.id.logo_image)
        clockOverlay = findViewById(R.id.clock_overlay)
        clockDate = findViewById(R.id.clock_date)
        clockTime = findViewById(R.id.clock_time)

        viewModel = ViewModelProvider(this)[WelcomeViewModel::class.java]

        setupNavBar()
        startClock()

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    when (state) {
                        is DisplayUiState.Loading -> {
                            loadingView.visibility = View.VISIBLE
                            loadingSpinner.visibility = View.VISIBLE
                            loadingText.text = getString(R.string.loading_guestboard)
                            loadingSubtext.text = getString(R.string.loading_hint)
                            mainContent.visibility = View.GONE
                        }
                        is DisplayUiState.Loaded -> {
                            loadingView.visibility = View.GONE
                            mainContent.visibility = View.VISIBLE
                            clockOverlay.visibility = View.VISIBLE
                            try {
                                accentColor = Color.parseColor(state.payload.settings.accentColor)
                            } catch (_: Exception) { }
                            if (!dataLoaded) {
                                dataLoaded = true
                                switchTab(0, force = true)
                            } else {
                                updateNavSelection(currentTabIndex)
                            }
                            loadBackground(state.payload)
                        }
                        is DisplayUiState.Error -> {
                            if (!dataLoaded) {
                                loadingView.visibility = View.VISIBLE
                                loadingSpinner.visibility = View.GONE
                                loadingText.text = getString(R.string.loading_guestboard)
                                loadingSubtext.text = getString(R.string.loading_hint)
                                mainContent.visibility = View.GONE
                            }
                        }
                        is DisplayUiState.Unpaired -> {
                            startActivity(Intent(this@WelcomeActivity, PairingActivity::class.java))
                            finish()
                        }
                    }
                }
            }
        }
    }

    private fun setupNavBar() {
        val inflater = LayoutInflater.from(this)
        tabs.forEachIndexed { index, tab ->
            val item = inflater.inflate(R.layout.item_nav_tab, bottomNav, false)
            item.findViewById<ImageView>(R.id.nav_icon).setImageResource(tab.iconRes)
            item.findViewById<TextView>(R.id.nav_label).text = tab.label

            // Switch tab when nav item gains focus (natural D-pad left/right)
            item.setOnFocusChangeListener { _, hasFocus ->
                if (hasFocus) {
                    switchTab(index)
                }
            }

            // Select/click also switches
            item.setOnClickListener { switchTab(index) }

            bottomNav.addView(item)
            navItems.add(item)
        }

        // Set initial focus to first nav item after layout
        bottomNav.post {
            navItems.firstOrNull()?.requestFocus()
        }
    }

    fun switchTab(index: Int, force: Boolean = false) {
        // Debounce rapid presses
        val now = System.currentTimeMillis()
        if (!force && now - lastTabSwitchTime < TAB_SWITCH_DEBOUNCE_MS) return
        if (!force && index == currentTabIndex) return
        lastTabSwitchTime = now

        currentTabIndex = index

        // Get or create cached fragment
        val fragment = fragmentCache.getOrPut(index) {
            tabs[index].fragmentFactory()
        }

        // Use show/hide instead of replace to preserve fragment state
        val transaction = supportFragmentManager.beginTransaction()

        // Hide all fragments
        for ((idx, frag) in fragmentCache) {
            if (frag.isAdded) {
                transaction.hide(frag)
            }
        }

        // Show or add the target fragment
        if (fragment.isAdded) {
            transaction.show(fragment)
        } else {
            transaction.add(R.id.tab_container, fragment, "tab_$index")
        }

        transaction.commitNowAllowingStateLoss()
        updateNavSelection(index)
    }

    private fun updateNavSelection(selectedIndex: Int) {
        navItems.forEachIndexed { i, item ->
            val isSelected = i == selectedIndex
            val icon = item.findViewById<ImageView>(R.id.nav_icon)
            val label = item.findViewById<TextView>(R.id.nav_label)
            val tintColor = if (isSelected) (accentColor ?: ContextCompat.getColor(this, R.color.text_primary))
                else ContextCompat.getColor(this, R.color.text_muted)

            icon.imageTintList = ColorStateList.valueOf(tintColor)
            label.setTextColor(tintColor)
            item.setBackgroundResource(if (isSelected) R.drawable.bg_nav_item_selected else 0)
        }
    }

    private fun loadBackground(payload: DisplayPayload) {
        val bgUrl = payload.settings.backgroundImageUrl
        if (!bgUrl.isNullOrBlank()) {
            backgroundImage.visibility = View.VISIBLE
            backgroundDim.visibility = View.VISIBLE
            Glide.with(this).load(bgUrl).centerCrop().into(backgroundImage)
        } else if (payload.property.photoUrl != null) {
            backgroundImage.visibility = View.VISIBLE
            backgroundDim.visibility = View.VISIBLE
            Glide.with(this).load(payload.property.photoUrl).centerCrop().into(backgroundImage)
        }

        val logoUrl = payload.settings.logoUrl
        if (!logoUrl.isNullOrBlank()) {
            logoImage.visibility = View.VISIBLE
            Glide.with(this).load(logoUrl).into(logoImage)
        } else {
            logoImage.visibility = View.GONE
        }
    }

    private val clockRunnable = object : Runnable {
        override fun run() {
            val now = Date()
            clockDate.text = dateFormat.format(now)
            clockTime.text = timeFormat.format(now)
            clockHandler.postDelayed(this, 15_000)
        }
    }

    private fun startClock() {
        clockRunnable.run()
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_DOWN) {
            val focused = currentFocus
            // If nothing has focus, or focus is on something outside our nav/content,
            // force it back to the current nav item
            if (focused == null) {
                if (currentTabIndex >= 0 && currentTabIndex < navItems.size) {
                    navItems[currentTabIndex].requestFocus()
                    return true
                }
            }
        }
        return super.dispatchKeyEvent(event)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        forceNavFocus()
    }

    override fun onResume() {
        super.onResume()
        forceNavFocus()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            forceNavFocus()
        }
    }

    private fun forceNavFocus() {
        if (currentTabIndex >= 0 && currentTabIndex < navItems.size) {
            bottomNav.postDelayed({
                navItems[currentTabIndex].requestFocus()
            }, 150)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        clockHandler.removeCallbacks(clockRunnable)
    }
}
