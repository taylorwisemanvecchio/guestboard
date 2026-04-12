package com.infratech.guestboard.data.model

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class PairingRequest(val code: String)

@JsonClass(generateAdapter = true)
data class PairingResponse(
    val deviceToken: String,
    val propertyName: String
)
