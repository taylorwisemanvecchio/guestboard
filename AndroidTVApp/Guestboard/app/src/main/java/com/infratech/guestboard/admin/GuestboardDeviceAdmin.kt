package com.infratech.guestboard.admin

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.provider.Settings
import android.util.Log
import java.util.concurrent.Executors

class GuestboardDeviceAdmin : DeviceAdminReceiver() {

    companion object {
        private const val TAG = "GuestboardDeviceAdmin"

        fun getComponentName(context: Context): ComponentName {
            return ComponentName(context, GuestboardDeviceAdmin::class.java)
        }

        /**
         * Set up Device Owner policies:
         * - Set Guestboard as preferred home
         * - Allow lock task mode for our app and streaming apps
         */
        fun setupDeviceOwner(context: Context) {
            try {
                val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE)
                        as DevicePolicyManager
                val componentName = getComponentName(context)

                if (!dpm.isDeviceOwnerApp(context.packageName)) {
                    Log.w(TAG, "Not device owner")
                    return
                }

                // Set as preferred home activity
                val filter = IntentFilter(Intent.ACTION_MAIN)
                filter.addCategory(Intent.CATEGORY_HOME)
                filter.addCategory(Intent.CATEGORY_DEFAULT)
                val activity = ComponentName(
                    context.packageName,
                    "com.infratech.guestboard.SplashActivity"
                )
                dpm.addPersistentPreferredActivity(componentName, filter, activity)

                // Whitelist our app and streaming apps for lock task mode
                val allowedPackages = mutableListOf(context.packageName)
                allowedPackages.addAll(StreamingApps.WIPE_PACKAGES)
                dpm.setLockTaskPackages(componentName, allowedPackages.toTypedArray())

                // Enable Home button in lock task mode — it will return to Guestboard
                // since we're set as the preferred home activity
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    dpm.setLockTaskFeatures(
                        componentName,
                        DevicePolicyManager.LOCK_TASK_FEATURE_HOME
                    )
                }

                // Auto-enable accessibility service for Home button interception
                try {
                    val serviceName = "${context.packageName}/com.infratech.guestboard.service.HomeButtonService"
                    val existing = Settings.Secure.getString(
                        context.contentResolver,
                        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
                    ) ?: ""
                    if (!existing.contains(serviceName)) {
                        val newValue = if (existing.isEmpty()) serviceName else "$existing:$serviceName"
                        Settings.Secure.putString(
                            context.contentResolver,
                            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
                            newValue
                        )
                        Settings.Secure.putInt(
                            context.contentResolver,
                            Settings.Secure.ACCESSIBILITY_ENABLED,
                            1
                        )
                        Log.i(TAG, "Auto-enabled accessibility service")
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Could not auto-enable accessibility service: ${e.message}")
                    Log.w(TAG, "Enable manually: Settings > Accessibility > Guestboard")
                }

                // Unhide any previously hidden launchers (fix from earlier approach)
                val launchers = listOf(
                    "com.google.android.tvlauncher",
                    "com.google.android.apps.tv.launcherx",
                    "com.google.android.leanbacklauncher"
                )
                for (launcher in launchers) {
                    try {
                        dpm.setApplicationHidden(componentName, launcher, false)
                    } catch (_: Exception) { }
                }

                Log.i(TAG, "Device Owner setup complete")
            } catch (e: Exception) {
                Log.e(TAG, "Device Owner setup failed: ${e.message}")
            }
        }

        /**
         * Start lock task mode (kiosk mode).
         * Home button becomes a no-op. Back button still works within the app.
         * Streaming apps whitelisted in setLockTaskPackages can still be launched.
         */
        fun startLockTask(activity: android.app.Activity) {
            try {
                activity.startLockTask()
                Log.i(TAG, "Lock task mode started")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start lock task: ${e.message}")
            }
        }

        /**
         * Stop lock task mode (for debug/maintenance).
         */
        fun stopLockTask(activity: android.app.Activity) {
            try {
                activity.stopLockTask()
                Log.i(TAG, "Lock task mode stopped")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to stop lock task: ${e.message}")
            }
        }

        /**
         * Clear app data for a list of packages.
         * Requires Device Owner mode.
         */
        fun clearAppData(context: Context, packages: List<String>) {
            try {
                val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE)
                        as DevicePolicyManager
                val componentName = getComponentName(context)

                if (!dpm.isDeviceOwnerApp(context.packageName)) {
                    Log.w(TAG, "Not device owner, cannot clear app data")
                    return
                }

                val executor = Executors.newSingleThreadExecutor()
                for (pkg in packages) {
                    try {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                            dpm.clearApplicationUserData(componentName, pkg, executor) { packageName, succeeded ->
                                Log.i(TAG, "Cleared $packageName: $succeeded")
                            }
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed to clear $pkg: ${e.message}")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to clear app data: ${e.message}")
            }
        }

        fun isDeviceOwner(context: Context): Boolean {
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE)
                    as DevicePolicyManager
            return dpm.isDeviceOwnerApp(context.packageName)
        }
    }

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.i(TAG, "Device admin enabled")
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.i(TAG, "Device admin disabled")
    }
}
