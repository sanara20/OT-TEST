OT ගණකය - ෆෝන් එකට දාගන්නා ක්‍රම

=== ක්‍රමය 1: PWA (වේගවත්ම) ===
  1. පරිගණකයේ මෙම zip එක Extract කරන්න. "OT" folder එක ලැබේ.
  2. https://app.netlify.com/drop වෙත OT folder එක drag කරන්න.
  3. නොමිලේ ගිණුමකින් "Claim site" කර Link එක ස්ථිර කරන්න.
  4. ෆෝන් එකේ Chrome වලින් Link එක විවෘත කර ⋮ -> "Install app".

=== ක්‍රමය 2: APK - PWABuilder (පරිගණකයේ මෙවලම් ඕනේ නෑ) ===
  1. ක්‍රමය 1 ට අනුව Link එකක් හදාගන්න.
  2. https://www.pwabuilder.com වෙත ගොස් ඔබේ Link එක ඇතුළත් කර Start ඔබන්න.
  3. "Package for stores" -> Android -> Generate / Download.
  4. බාගත කළ zip එක ඇතුළේ ඇති .apk ගොනුව ෆෝන් එකට දමා install කරන්න.
  සටහන: මෙම APK එකේත් notification පරිස්සම PWA එකටම සමානයි (ඇප් එක වසා ඇති විට වේලාවට එන දැනුම්දීම නැත).

=== ක්‍රමය 3: APK - Capacitor (නියමිත වේලාවට එන දෛනික notification සමඟ) ===
  Windows පරිගණකයක් සහ අන්තර්ජාලය ඕනේ.
  1. Node.js (LTS) install කරන්න: https://nodejs.org
  2. Android Studio install කරන්න: https://developer.android.com/studio
     පළමු වරට විවෘත කරන විට "Standard" setup තෝරා Android SDK බාගත වන තෙක් රැඳී සිටින්න.
  3. C:\ot-apk නමින් folder එකක් හදා, එහි "www" නමින් folder එකක් හදන්න.
     OT folder එකේ ඇති ගොනු ඔක්කොම (index.html, app.js, engine.js, holidays.js, sw.js,
     manifest.webmanifest, icons folder) www ඇතුළට දමන්න.
  4. C:\ot-apk folder එක තුළ Command Prompt විවෘත කරන්න (folder එකේ address bar එකේ "cmd" ටයිප් කර Enter).
  5. පහත විධාන එකින් එක ධාවනය කරන්න:
       npm init -y
       npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/local-notifications
       npx cap init "OT Calc" lk.ot.calc --web-dir=www
       npx cap add android
       npx cap sync
       npx cap open android
  6. Android Studio විවෘත වී පහළ "Gradle sync" ඉවර වන තෙක් රැඳී සිටින්න (පළමු වරට විනාඩි කිහිපයක් යයි).
  7. මෙනුව: Build -> Build Bundle(s) / APK(s) -> Build APK(s). අවසන් වූ විට "locate" ඔබන්න.
     APK එක: C:\ot-apk\android\app\build\outputs\apk\debug\app-debug.apk
  8. එය ෆෝන් එකට යවා (USB / WhatsApp / Drive) ඇරලා install කරන්න.
     "Install unknown apps" ඉඩ ඉල්ලුවොත් ඒ ගොනුව විවෘත කරන ඇප් එකට ඉඩ දෙන්න.
  9. ඇප් එක පළමුව විවෘත කරද්දී දැනුම්දීම් අවසරය ඉල්ලයි, "Allow" ඔබන්න.
  ඇප් එක පසුව අලුත් කිරීම: www ගොනු ආදේශ කර, "npx cap sync" ධාවනය කර, නැවත Build APK කරන්න.

  වැදගත්: APK ඇප් එකේ දත්ත, Chrome (PWA) එකේ දත්ත වලින් වෙනස්. PWA එකේ දත්ත තිබේ නම්
  මුලින් Settings -> "උපස්ථ ගොනුව බාගන්න", ඉන්පසු APK එකේ "ගොනුවකින් ප්‍රතිස්ථාපනය".
