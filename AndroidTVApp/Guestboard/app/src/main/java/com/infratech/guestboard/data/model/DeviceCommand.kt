package com.infratech.guestboard.data.model

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class DeviceCommand(
    val command: String,  // "wipe_credentials", "reboot", etc.
    val timestamp: String
)

@JsonClass(generateAdapter = true)
data class CommandAck(
    val command: String,
    val status: String  // "completed", "failed"
)
