package com.infratech.guestboard.data.repository

import com.infratech.guestboard.data.api.RetrofitClient
import com.infratech.guestboard.data.model.DisplayPayload

class TokenRevokedException : Exception("Device token has been revoked")

class DisplayRepository {
    private val api = RetrofitClient.api

    suspend fun getDisplayData(token: String): Result<DisplayPayload> {
        return try {
            val response = api.getDisplay(token)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                when (response.code()) {
                    403, 404 -> Result.failure(TokenRevokedException())
                    else -> Result.failure(Exception("Server error (${response.code()})"))
                }
            }
        } catch (e: Exception) {
            if (e is TokenRevokedException) throw e
            Result.failure(Exception("Network error"))
        }
    }
}
