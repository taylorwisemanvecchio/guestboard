package com.infratech.guestboard.ui.pairing

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.infratech.guestboard.data.repository.PairingRepository
import com.infratech.guestboard.util.DataStoreManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class PairingUiState {
    data object Idle : PairingUiState()
    data object Loading : PairingUiState()
    data class Success(val propertyName: String) : PairingUiState()
    data class Error(val message: String) : PairingUiState()
}

class PairingViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = PairingRepository(DataStoreManager(application))

    private val _uiState = MutableStateFlow<PairingUiState>(PairingUiState.Idle)
    val uiState: StateFlow<PairingUiState> = _uiState

    fun pair(code: String) {
        if (code.length != 6) {
            _uiState.value = PairingUiState.Error("Please enter a 6-character code")
            return
        }

        viewModelScope.launch {
            _uiState.value = PairingUiState.Loading
            val result = repository.pair(code.uppercase())
            _uiState.value = result.fold(
                onSuccess = { PairingUiState.Success(it.propertyName) },
                onFailure = { PairingUiState.Error(it.message ?: "Pairing failed") }
            )
        }
    }
}
