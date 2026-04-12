package com.infratech.guestboard.util

import android.graphics.Bitmap
import android.graphics.Color
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter

object QrUtils {
    fun generateWifiQr(ssid: String, password: String?, size: Int = 512): Bitmap {
        // WiFi QR format: WIFI:T:WPA;S:<ssid>;P:<password>;;
        val escapedSsid = ssid.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\"", "\\\"").replace(":", "\\:")
        val escapedPass = password?.replace("\\", "\\\\")?.replace(";", "\\;")?.replace(",", "\\,")?.replace("\"", "\\\"")?.replace(":", "\\:") ?: ""
        val wifiString = "WIFI:T:WPA;S:$escapedSsid;P:$escapedPass;;"

        val hints = mapOf(EncodeHintType.MARGIN to 1)
        val bitMatrix = QRCodeWriter().encode(wifiString, BarcodeFormat.QR_CODE, size, size, hints)

        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.RGB_565)
        for (x in 0 until size) {
            for (y in 0 until size) {
                bitmap.setPixel(x, y, if (bitMatrix[x, y]) Color.BLACK else Color.WHITE)
            }
        }
        return bitmap
    }
}
