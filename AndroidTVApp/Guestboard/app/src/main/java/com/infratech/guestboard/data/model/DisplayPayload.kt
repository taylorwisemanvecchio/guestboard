package com.infratech.guestboard.data.model

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class DisplayPayload(
    val property: PropertyInfo,
    val guest: GuestInfo?,
    val weather: WeatherInfo?,
    val recommendations: List<RecommendationInfo>,
    val settings: DisplaySettings
)

@JsonClass(generateAdapter = true)
data class PropertyInfo(
    val name: String,
    val photoUrl: String?,
    val wifiName: String?,
    val wifiPassword: String?,
    val checkoutInstructions: String?,
    val houseRules: String?,
    val hostName: String?,
    val hostPhone: String?,
    val hostEmail: String?
)

@JsonClass(generateAdapter = true)
data class GuestInfo(
    val name: String,
    val welcomeMessage: String,
    val welcomeNote: String?,
    val checkIn: String,
    val checkOut: String,
    val occasion: String?
)

@JsonClass(generateAdapter = true)
data class WeatherInfo(
    val temp: Int,
    val feelsLike: Int,
    val description: String,
    val icon: String,
    val humidity: Int,
    val windSpeed: Int
)

@JsonClass(generateAdapter = true)
data class RecommendationInfo(
    val name: String,
    val category: String,
    val address: String,
    val description: String,
    val photoUrl: String?,
    val rating: Double?,
    val hostNote: String?
)

@JsonClass(generateAdapter = true)
data class DisplaySettings(
    val showWeather: Boolean,
    val showRecommendations: Boolean,
    val showWifi: Boolean,
    val showCheckout: Boolean,
    val accentColor: String,
    val theme: String,
    val backgroundImageUrl: String?,
    val logoUrl: String?
)
