# Keep application model names stable for JSON backup compatibility across minified releases.
-keep class ru.partnercrm.data.model.** { *; }
-keep class ru.partnercrm.data.backup.** { *; }
