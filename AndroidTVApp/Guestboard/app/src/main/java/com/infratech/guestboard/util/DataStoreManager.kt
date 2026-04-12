package com.infratech.guestboard.util

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "guestboard_prefs")

class DataStoreManager(private val context: Context) {
    companion object {
        private val DEVICE_TOKEN_KEY = stringPreferencesKey("device_token")
    }

    suspend fun saveToken(token: String) {
        context.dataStore.edit { prefs ->
            prefs[DEVICE_TOKEN_KEY] = token
        }
    }

    suspend fun getToken(): String? {
        return context.dataStore.data.map { prefs ->
            prefs[DEVICE_TOKEN_KEY]
        }.first()
    }

    suspend fun clearToken() {
        context.dataStore.edit { prefs ->
            prefs.remove(DEVICE_TOKEN_KEY)
        }
    }
}
