package com.infratech.guestboard.admin

/**
 * List of streaming app packages whose credentials should be wiped on guest checkout.
 * Guestboard's own package is intentionally excluded.
 */
object StreamingApps {
    val WIPE_PACKAGES = listOf(
        "com.netflix.ninja",                    // Netflix (TV)
        "com.netflix.mediaclient",              // Netflix (mobile/alt)
        "com.google.android.youtube.tv",        // YouTube (TV)
        "com.google.android.youtube",           // YouTube (mobile)
        "com.google.android.apps.youtube.tv",   // YouTube (alt TV)
        "com.hulu.livingroomplus",              // Hulu (TV)
        "com.hulu.plus",                        // Hulu (alt)
        "com.disney.disneyplus",                // Disney+
        "com.amazon.amazonvideo.livingroom",    // Prime Video (TV)
        "com.amazon.avod",                      // Prime Video (alt)
        "com.hbo.hbomax",                       // HBO Max
        "com.wbd.stream",                       // Max (new name)
        "com.peacocktv.peacockandroid",         // Peacock
        "com.apple.atve.androidtv.appletv",    // Apple TV
        "com.apple.atve.amazon.appletv",        // Apple TV (Amazon)
        "com.spotify.tv.android",               // Spotify (TV)
        "com.spotify.music",                    // Spotify (mobile)
        "com.cbs.ott",                          // Paramount+
        "com.cbs.app",                          // Paramount+ (alt)
        "tv.pluto.android",                     // Pluto TV
        "com.xfinity.cloudtvr.tenfoot",         // Xfinity Stream
        "com.gotv.nflgamecenter.us.lite",       // NFL
        "com.plex.android",                     // Plex
        "com.plexapp.android",                  // Plex (alt)
        "com.movieboxpro.androidtv",            // MovieBox Pro
    )
}
