package com.infratech.guestboard.util

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

object DateUtils {
    fun formatDateNice(isoDate: String): String {
        return try {
            val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
            parser.timeZone = TimeZone.getTimeZone("UTC")
            val date = parser.parse(isoDate) ?: return isoDate

            val cal = Calendar.getInstance()
            cal.time = date

            val dayOfMonth = cal.get(Calendar.DAY_OF_MONTH)
            val suffix = when {
                dayOfMonth in 11..13 -> "th"
                dayOfMonth % 10 == 1 -> "st"
                dayOfMonth % 10 == 2 -> "nd"
                dayOfMonth % 10 == 3 -> "rd"
                else -> "th"
            }

            val formatter = SimpleDateFormat("EEEE, MMMM d", Locale.US)
            val timeFmt = SimpleDateFormat("ha", Locale.US)
            "${formatter.format(date)}$suffix, ${cal.get(Calendar.YEAR)} at ${timeFmt.format(date)}"
        } catch (_: Exception) {
            isoDate
        }
    }
}
