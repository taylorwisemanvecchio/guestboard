package com.infratech.guestboard.data.api

import com.infratech.guestboard.data.model.CommandAck
import com.infratech.guestboard.data.model.DeviceCommand
import com.infratech.guestboard.data.model.DisplayPayload
import com.infratech.guestboard.data.model.PairingRequest
import com.infratech.guestboard.data.model.PairingResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface GuestboardApi {
    @POST("api/pairing/pair")
    suspend fun pair(@Body request: PairingRequest): Response<PairingResponse>

    @GET("api/display/{deviceToken}")
    suspend fun getDisplay(@Path("deviceToken") token: String): Response<DisplayPayload>

    @GET("api/device/{deviceToken}/commands")
    suspend fun getCommands(@Path("deviceToken") token: String): Response<DeviceCommand?>

    @POST("api/device/{deviceToken}/commands/ack")
    suspend fun ackCommand(@Path("deviceToken") token: String, @Body ack: CommandAck): Response<Unit>
}
