package com.infratech.guestboard.ui.welcome

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.infratech.guestboard.data.model.DisplayPayload
import com.infratech.guestboard.data.repository.DisplayRepository
import com.infratech.guestboard.data.repository.TokenRevokedException
import com.infratech.guestboard.util.Constants
import com.infratech.guestboard.util.DataStoreManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class DisplayUiState {
    data object Loading : DisplayUiState()
    data class Loaded(val payload: DisplayPayload) : DisplayUiState()
    data class Error(val message: String) : DisplayUiState()
    data object Unpaired : DisplayUiState()
}

class WelcomeViewModel(application: Application) : AndroidViewModel(application) {
    private val displayRepository = DisplayRepository()
    private val dataStoreManager = DataStoreManager(application)

    private val _uiState = MutableStateFlow<DisplayUiState>(DisplayUiState.Loading)
    val uiState: StateFlow<DisplayUiState> = _uiState

    private var lastPayload: DisplayPayload? = null

    init {
        startRefreshLoop()
    }

    private fun startRefreshLoop() {
        viewModelScope.launch {
            while (true) {
                fetchDisplay()
                delay(Constants.REFRESH_INTERVAL_MS)
            }
        }
    }

    private suspend fun fetchDisplay() {
        val token = dataStoreManager.getToken()
        if (token == null) {
            _uiState.value = DisplayUiState.Unpaired
            return
        }

        val result = displayRepository.getDisplayData(token)
        result.fold(
            onSuccess = { payload ->
                lastPayload = payload
                _uiState.value = DisplayUiState.Loaded(payload)
            },
            onFailure = { error ->
                if (error is TokenRevokedException) {
                    dataStoreManager.clearToken()
                    _uiState.value = DisplayUiState.Unpaired
                } else {
                    Log.w("WelcomeViewModel", "Fetch failed: ${error.message}")
                    // Keep last good data on transient errors
                    if (lastPayload != null) {
                        // Don't change state, keep showing last good data
                    } else {
                        _uiState.value = DisplayUiState.Error(error.message ?: "Connection error")
                    }
                }
            }
        )
    }
}
