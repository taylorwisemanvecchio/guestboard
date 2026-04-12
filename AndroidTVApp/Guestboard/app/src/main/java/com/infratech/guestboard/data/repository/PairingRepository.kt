package com.infratech.guestboard.data.repository

import com.infratech.guestboard.data.api.RetrofitClient
import com.infratech.guestboard.data.model.PairingRequest
import com.infratech.guestboard.data.model.PairingResponse
import com.infratech.guestboard.util.DataStoreManager

class PairingRepository(private val dataStoreManager: DataStoreManager) {
    private val api = RetrofitClient.api

    suspend fun pair(code: String): Result<PairingResponse> {
        return try {
            val response = api.pair(PairingRequest(code))
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                dataStoreManager.saveToken(body.deviceToken)
                Result.success(body)
            } else {
                Result.failure(Exception(
                    when (response.code()) {
                        400 -> "Invalid or expired pairing code"
                        404 -> "Pairing code not found"
                        else -> "Pairing failed (${response.code()})"
                    }
                ))
            }
        } catch (e: Exception) {
            Result.failure(Exception("Network error. Please check your connection."))
        }
    }

    suspend fun getStoredToken(): String? = dataStoreManager.getToken()

    suspend fun clearToken() = dataStoreManager.clearToken()
}
