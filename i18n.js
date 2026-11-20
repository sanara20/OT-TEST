/* Sinhala -> English UI translation (applied to rendered text when the language is English) */
(function () {
  const EXACT = {
    'ඉරි': 'Sun', 'සඳු': 'Mon', 'අඟ': 'Tue', 'බදා': 'Wed', 'බ්‍රහ': 'Thu', 'සිකු': 'Fri', 'සෙන': 'Sat',
    'සීමා': 'Limits', 'නිවාඩු': 'Holidays', 'ඇප්': 'App', 'පුද්ගලික': 'Personal', 'මාසය': 'Month', 'වවුචර්': 'Vouchers', 'ඉල්ලීම්': 'Claims', 'නම': 'Name', 'අද': 'Today', 'සටහන් කරන්න': 'Log', 'පැමිණීම': 'Arrival', 'පිටවීම': 'Departure', 'සේවය කළා': 'Worked', 'සුරකින්න': 'Save', 'දීමනා': 'Allowance', 'එකතුව': 'Total', 'දිනය': 'Date', 'පොදු 35': 'Gen 35', 'සතියේ දිනය': 'Day',  'වසන්න': 'Close', 'දිනය': 'Date', 'ආරම්භය': 'Start', 'අවසානය': 'End', 'උදවු': 'Help',
    'මකන්න': 'Delete', 'නැවත': 'Restore', 'ඉවත්': 'Remove', 'OT පැය': 'OT hours', 'විවේක දින': 'Off days'
  };
  const SUB = {
    /* months / days */
    'ජනවාරි': 'January', 'පෙබරවාරි': 'February', 'මාර්තු': 'March', 'අප්‍රේල්': 'April', 'මැයි': 'May', 'ජූනි': 'June', 'ජූලි': 'July',
    'අගෝස්තු': 'August', 'සැප්තැම්බර්': 'September', 'ඔක්තෝබර්': 'October', 'නොවැම්බර්': 'November', 'දෙසැම්බර්': 'December',
    'ඉරිදා': 'Sunday', 'සඳුදා': 'Monday', 'අඟහරුවාදා': 'Tuesday', 'බදාදා': 'Wednesday', 'බ්‍රහස්පතින්දා': 'Thursday', 'සිකුරාදා': 'Friday', 'සෙනසුරාදා': 'Saturday',
    /* titles / nav */
    'OT ගණකය': 'OT Calculator', 'මුල් පිටුව': 'Home', 'මාසික සටහන': 'Monthly log', 'සුරැකි ඉල්ලීම්': 'Saved claims', 'සැකසුම්': 'Settings', 
     
    /* settings tabs */
     'වැටුප් / නීති': 'Pay / Rules',   
    'පෞද්ගලික තොරතුරු': 'Personal details',  'තනතුර': 'Designation', 'සේවා ස්ථානය': 'Service station', 'වැටුප් අංකය': 'Salary number',
    'පොදු 35 අ වවුචරය': 'Gen 35a voucher', 'ගෙවීම් ඒකකය': 'Pay unit', 'ගිණුම්': 'Accounts',
    'විෂය සංකේතය (උදා: AA, AB)': 'Subject code (e.g. AA, AB)', 'අතිකාල රාජකාරි විස්තරය': 'Overtime duty description',
    'දිගු විස්තරයක් නම් කොටස් වශයෙන් අනු අංක යටතේ ලියන්න (1. ... 2. ...). Enter ඔබා නව පේළියක් ආරම්භ කරන්න. හිස් නම් වවුචරයේ විෂය සංකේත වාක්‍යය පමණක් මුද්‍රණය වේ.': 'For a long description write the parts under numbers (1. ... 2. ...). Press Enter for a new line. If empty only the subject code line is printed on the voucher.',
    'වැටුප සහ අනුපාත': 'Salary and rates', 'මූලික වැටුප (රු.)': 'Basic salary (Rs.)', 'OT පැයක අනුපාතය = වැටුප ÷': 'OT hourly rate = salary ÷', 'දෛනික දීමනාව = වැටුප ÷': 'Daily allowance = salary ÷',
    'දීමනාව: බොහෝ විට 30, සමහරුන්ට 20. OT: 200 හෝ 240.': 'Allowance: usually 30, for some 20. OT: 200 or 240.',
    'සාමාන්‍ය රාජකාරි වේලාවන්': 'Normal duty times', 'සතියේ දින (සඳුදා–සිකුරාදා)': 'Weekdays (Mon–Fri)', 'රජයේ ප්‍රසිද්ධ නිවාඩු දින': 'Public holidays',
      'OT නීති': 'OT rules', 'උදේ OT ගණන් ගන්නා වේලාව': 'Morning OT counted from', 'ප්‍රමාද වීමේ සහනය (විනාඩි)': 'Late grace (minutes)',
    'වටයන කොටස (විනාඩි)': 'Rounding block (minutes)', 'එක් පැත්තකට අවම (විනාඩි)': 'Minimum per side (minutes)', 'දවසකට අවම (විනාඩි)': 'Minimum per day (minutes)',
    'OT ගෙවන අවසාන වේලාව': 'OT payment cut-off time', 'මෙම වේලාවෙන් පසු රැඳී සිටි කාලය නොගෙවේ. සමහර කාල සීමා වලට වෙනස් වේලාවක් දාන්න.': 'Time after this cut-off is not paid. You can set a different time for some periods.',
    'සාමාන්‍ය අවසාන වේලාව': 'Default cut-off time', 'විශේෂ කාල සීමා (සිට / දක්වා / වේලාව)': 'Special periods (from / to / time)', '+ කාල සීමාවක් එක් කරන්න': '+ Add a period',
    'භාෂාව / Language': 'Language', 'මතක් කිරීම්': 'Reminders', 'දිනපතා සටහන් කරන්න මතක් කරන්න': 'Remind me daily to log my times', 'මතක් කරන වේලාව': 'Reminder time',
    'දැනුම්දීම් අවසර දෙන්න': 'Allow notifications',
    'ඇප් එක විවෘතව තිබෙන විට වේලාව පැමිණි විට දැනුම්දීමක් සහ බැනරයක් පෙන්වයි. ඇප් එක වසා තිබෙන විටත් වේලාවට එන දැනුම්දීම සඳහා APK අනුවාදය අවශ්‍යයි.': 'While the app is open a notification and banner appear at the reminder time. For reminders while the app is closed the APK version is needed.',
    'දත්ත උපස්ථය': 'Data backup', 'උපස්ථ ගොනුව බාගන්න': 'Download backup file', 'ගොනුවකින් ප්‍රතිස්ථාපනය': 'Restore from file',
    'දත්ත ඇත්තේ මෙම ෆෝන් එකේ පමණි. Chrome දත්ත මැකුවොත් නැති වේ, ඒ නිසා කලින් කලට උපස්ථයක් ගන්න.': 'Data is stored only on this phone. It is lost if Chrome data is cleared, so take a backup now and then.',
    '❓ උදවු / භාවිත මාර්ගෝපදේශය': '❓ Help / user guide',
    /* caps */
    'මාසික අනුමත සීමා': 'Approved monthly limits', 'මාසය තෝරා අනුමත අතිකාල පැය සහ විවේක දින (සති අන්ත/නිවාඩු දිනවල ගෙවන දින) ගණන දාන්න. අලුත් සීමාවක් දාන තෙක් පෙර මාසයේ අගයම යෙදේ. හිස් තැබුවොත් ඒ සීමාව ඉවත් වේ.': 'Choose a month and enter the approved overtime hours and the number of off days (paid weekend/holiday days). The previous month value applies until you enter a new limit. Leaving a field empty removes that limit.',
      'සීමාවක් නෑ': 'No limit', 'සීමාව සුරකින්න': 'Save limit', 'OT පැය සීමාව ඉවත් කරන්න': 'Remove OT hour limit', 'විවේක දින සීමාව ඉවත් කරන්න': 'Remove rest-day limit',
    'OT පැය:': 'OT hours:', 'විවේක දින:': 'Off days:', '— (පෙර මාසයෙන්)': '— (from previous month)',  'සීමාව සුරකිණි': 'Limit saved', 'සීමාව ඉවත් කළා': 'Limit removed',
    /* holidays */
      'මෙම වසර සඳහා ලැයිස්තුවක් ඇතුළත් කර නෑ. අවශ්‍ය දින පහත එක් කරන්න.': 'No list is included for this year. Add the days below.',
     'උදා: විශේෂ නිවාඩුව': 'e.g. Special holiday', 'නිවාඩු දිනයක් එක් කරන්න': 'Add a holiday', 'විශේෂ නිවාඩු දිනය': 'Special holiday', 'දිනයක් තෝරන්න': 'Pick a date', 'නිවාඩු දිනය එක් කළා': 'Holiday added',

    /* ---- UI batch 2 ---- */
    'තවම සුරැකි ඉල්ලීම් නෑ. "මාසය" පිටුවේ Claim බොත්තම ඔබන්න.': 'No saved claims yet. Press the Claim button on the "Month" page.',
    'ෆෝන් එකට දාගන්න: Chrome මෙනුව (⋮) → "Install app" / "Add to Home screen".': 'Install on your phone: Chrome menu (⋮) → "Install app" / "Add to Home screen".',
    'iPhone: Safari හි Share බොත්තම → "Add to Home Screen".': 'iPhone: Safari Share button → "Add to Home Screen".',
    'අද පැමිණීම/පිටවීම තවම සටහන් කර නෑ': "Today's arrival/departure not logged yet",
    'අද පැමිණීම / පිටවීම සටහන් කරන්න.': "Log today's arrival / departure.",
    'රාත්‍රිය පුරා සේවය (පිටවීම ඊළඟ දවසේ)': 'Overnight duty (departure next day)',
    'මාසික හිමිකම තහවුරු කරන්න (Claim)': 'Confirm monthly claim (Claim)',
    'වෙනත් දිනයක් තෝරන්න': 'Pick another date', 'දින දර්ශනය වසන්න': 'Close calendar',
    'අද OT වේලාව සීමාවක් නැත': 'No OT time limit today',
    'සතියේ දිනය': 'Weekday', 'රාජකාරි': 'Duty', ' දක්වා': ' until', ' සිට': ' from',
    'පැමිණීම = දැන්': 'Arrival = now', 'පිටවීම = දැන්': 'Departure = now',
    'වෙනත් වේලාවක්': 'Other time', 'මාසික අතිකාල සීමාව': 'Monthly overtime limit',
    'සීමා වෙනස් කරන්න': 'Change limits', 'මෙම මාසයේ එකතුව': "This month's total",
    'ගෙවිය හැකි OT පැය': 'Payable OT hours', 'ගෙවිය හැකි දීමනා දින': 'Payable allowance days',
    'දෛනික දීමනා මුදල': 'Daily allowance amount', 'දෛනික දීමනා': 'Daily allowance',
    'OT මුදල': 'OT amount', 'පැයක්': 'hourly', 'රු.': 'Rs.', 'සාරාංශය': 'Summary',
    'සේවය කළ දින': 'Days worked', 'මුළු OT පැය': 'Total OT hours', 'අනුමත උපරිමය': 'Approved maximum',
    'පැයක අනුපාතය': 'Hourly rate', 'විවේක දින (දීමනා සහිත)': 'Weekend off days (with allowance)',
    'නිවාඩු ගත් දින / off දින': 'Leave / off days', 'OT වවුචරය': 'OT voucher', 'දීමනා වවුචරය': 'Allowance voucher',
    'දිනපතා සටහන්': 'Daily log', 'සටහනක් නෑ': 'No entry', 'අසම්පූර්ණයි': 'Incomplete',
    'ඊළඟ දවසේ': 'next day', 'රාත්‍රි සේවයේ දිගුව': 'Night duty continuation',
    'හවස/රාත්‍රි': 'Evening/Night', 'උදේ': 'Morning', 'ඉතිරි': 'Remaining',
    'පෙර මාසය': 'Previous month', 'ඊළඟ මාසය': 'Next month',
    'සීමාව පෙර මාසයෙන් ගත්තකි': 'Limit taken from the previous month',

    /* ---- batch 3: explanations, alerts, claim sheet ---- */
    'ප්‍රමාද අඩු කිරීම: විනාඩි ': 'Late deduction: minutes ',
    'අවම කොන්දේසි සපුරා නැත (එක් පැත්තකට විනාඩි 30, දවසට පැය 1). OT නැත.': 'Minimum conditions not met (30 min per side, 1 hour per day). No OT.',
    'පෙ.ව. 9.00 ට පසු පැමිණීම. අද OT නැත.': 'Arrival after 9.00 a.m. No OT today.',
    'දෛනික දීමනාව + OT ': 'Daily allowance + OT ', 'ඊළඟ දවසේ දීමනාවක්ද හිමියි': "Next day's allowance is also due",
    'දෛනික දීමනාව පමණි': 'Daily allowance only', 'OT නැත (අවම කොන්දේසි සපුරා නැත).': 'No OT (minimum conditions not met).',
    'පෙ.ව. 9.00 ට පසු පැමිණීම: දීමනාව නැත.': 'Arrival after 9.00 a.m.: no allowance.',
    'සම්පූර්ණ කාලය OT ': 'Entire time is OT ', 'සාමාන්‍ය වේලාවට කලින් පිටවීම: දීමනාව නැත.': 'Departure before normal time: no allowance.',
    'ප්‍රමාදය හවසින් ආවරණය කර නැත: දීමනාව නැත.': 'Late arrival not covered in the evening: no allowance.',
    'පිටවීම පැමිණීමට පසු විය යුතුය. රාත්‍රි සේවයක් නම් "වෙනත් වේලාවක්" භාවිතා කරන්න': 'Departure must be after arrival. For overnight duty use "Other time"',
    'පිටවීම පැමිණීමට පසු විය යුතුය.': 'Departure must be after arrival.',
    'දත්ත සුරැකීමට නොහැකි විය': 'Could not save data',
    'ඉක්මවා ඇත ': 'Exceeded ', 'විවේක දින සීමාව ඉක්මවා ඇත': 'Off-day limit exceeded', 'අතිකාල සීමාව සම්පූර්ණයි': 'Overtime limit reached',
    'අතිකාල සීමාවට ආසන්නයි': 'Close to the overtime limit', 'අනුමත දින': 'Approved days', 'අනුමත ': 'Approved ',
    'පැය ඉක්මවා ඇත.': 'hours exceeded.', 'ඉක්මවූ': 'Excess', 'නොගෙවේ': 'not paid', 'දිනක්': 'day(s)', ' පමණි.': ' only.',
    'අද පිටවීම තවම සටහන් කර නෑ': "Today's departure not logged yet", 'පැමිණීම තවම සටහන් කර නෑ': 'Arrival not logged yet',
    'පැමිණීම ': 'Arrival ', ' · පිටවීම': ' · Departure',
    'පිටවන විට "පිටවීම = දැන්" ඔබන්න': 'When leaving, press "Departure = now"',
    'සති අන්ත / නිවාඩු': 'Weekends / holidays', 'අද වෙත': 'Go to today', 'සංස්කරණය': 'Edit',
    'සීමාව ඉක්මවූ දින (නොගෙවේ)': 'Days over limit (not paid)', 'සීමාව ඉක්මවූ පැය (නොගෙවේ)': 'Hours over limit (not paid)',
    'ඉක්මවූ පැය (නොගෙවේ)': 'Excess hours (not paid)', 'ඉක්මවූ දින (නොගෙවේ)': 'Excess days (not paid)',
    'සීමාව ඉක්මවූ පැය': 'Hours over limit', 'විවේක දින ගෙවීම': 'Off-day payment', 'අනුමත දින ගණන': 'Approved number of days',
    'මූලික වැටුප Settings වල ඇතුළත් කරන්න': 'Enter the basic salary in Settings', 'ඇප් එකක් ලෙස ෆෝන් එකට දාගන්න': 'Install as an app on your phone',
    'OT නෑ': 'No OT', 'වැරදි වේලාවක්': 'Invalid time', 'වැරදියි': 'Invalid', '↳රාත්‍රි': '↳Night',
    'මෙම මාසය ': 'This month was saved on ', ' දින සුරකින ලදී. නැවත තහවුරු කළොත් අලුත් අගයන් ආදේශ වේ.': '. Confirming again replaces it with the new values.',
    'මෙම දවස ': 'This day is the continuation of the night duty that began on ',
    ' දින ආරම්භ වූ රාත්‍රි සේවයේ දිගුවකි. එහි ගණනය ඒ දවසේ සටහනට ඇතුළත්ය.': ". Its calculation is included in that day's entry.",
    'ඒ දවස සංස්කරණය කරන්න': 'Edit that day',
    'දැනට එක් වේලාවක් පමණයි. සුරකින්න, අනෙක් වේලාව පසුව ඇතුළත් කරන්න පුළුවන්.': 'Only one time so far. Save, and add the other time later.',
    'පැමිණීම සහ/හෝ පිටවීම ඇතුළත් කරන්න': 'Enter arrival and/or departure',
    'රාත්‍රි/දිගු කාලය: ': 'Night/long duty: ', ' (ඊළඟ දවස: ': ' (next day: ', 'නිවාඩු දිනය': 'Holiday', ' ට පසු කාලය ගණන් නොගනී.': ' onwards is not counted.',
    ' (ඔබ එක් කළ)': ' (added by you)', 'සීමාවක් නැත': 'No limit', 'ගෙවන දින ': 'Payable days ',
    'අතිකාල දීමනා ඉල්ලුම් පත්‍රය': 'Overtime Allowance Claim', 'නම:': 'Name:', 'මූලික වැටුප:': 'Basic salary:',
    'අයදුම්කරුගේ අත්සන සහ දිනය': "Applicant's signature and date", 'අනුමත කරන නිලධාරියාගේ අත්සන සහ දිනය': "Approving officer's signature and date",
    'අතිකාල සටහන් නැත': 'No overtime entries', 'මුළු අතිකාල පැය': 'Total overtime hours', 'අනුමත මාසික උපරිම පැය': 'Approved monthly maximum hours',
    'ගෙවිය යුතු අතිකාල පැය': 'Overtime hours payable', 'ගෙවිය යුතු අතිකාල මුදල': 'Overtime amount payable',
    'ඉහත අතිකාල පැය මා විසින් සේවය කරන ලද බවට සහතික කරමි.': 'I certify that the above overtime hours were worked by me.',
    'ඉල්ලීම සුරකින්න': 'Save claim', 'මුද්‍රණය / PDF': 'Print / PDF',

    /* ---- batch 4 ---- */
    'අතිකාල පැය': 'Overtime hours', 'ඉක්මවා ': 'Exceeded ', '00:00 න් පසු ': 'After 00:00: ', 'ඊළඟ මාසයට': 'Next month',
    'දීමනා = දෛනික දීමනාව': 'Allowance = daily allowance', 'දෛනික දීමනාව': 'Daily allowance',
    'මාසයක් තෝරන්න': 'Select a month', ' සුරකිණි': ' saved', 'සුරකිණි': 'Saved',
    'පැමිණීම හෝ පිටවීම ඇතුළත් කරන්න': 'Enter arrival or departure', 'වේලාවන් නිවැරදි කරන්න': 'Correct the times',
    '⚠ අසම්පූර්ණ දින ': '⚠ Incomplete days: ', ' ක් ඇත (පැමිණීම හෝ පිටවීම නැත). ඒවා ගණනයට ඇතුළත් නොවේ.': ' (arrival or departure missing). They are not included in the calculation.',
    ' සඳහා හිමිකම තහවුරු කර සුරකින්නද?': ' – confirm and save the claim?', '), දීමනා දින ': '), allowance days ',
    'ඉල්ලීම සුරැකිණි': 'Claim saved', 'මෙම සුරැකි ඉල්ලීම මකන්නද?': 'Delete this saved claim?',
    'මෙම බ්‍රවුසරය දැනුම්දීම් සඳහා සහාය නොදක්වයි': 'This browser does not support notifications',
    'දැනුම්දීම් සක්‍රියයි': 'Notifications enabled', 'අවසරය ලැබුණේ නෑ': 'Permission not granted',
    'දැනට ඇති දත්ත ප්‍රතිස්ථාපන ගොනුවෙන් ආදේශ කරන්නද?': 'Replace the existing data with the backup file?',
    'ප්‍රතිස්ථාපනය සම්පූර්ණයි': 'Restore complete', 'ගොනුව වැරදියි': 'Invalid file',

    /* ---- batch 5 ---- */
    'වවුචර් සකසන්න': 'Prepare vouchers', 'අනුපාත / නීති': 'Rates / Rules',
    'OT සහ PH ගණනය කිරීමේ අනුපාත': 'OT & PH calculation rates', 'OT පැයක අනුපාතය': 'OT hourly rate', 'දෛනික දීමනාව': 'Daily allowance',
    'මූලික වැටුප මේ අගයෙන් බෙදා ගණනය වේ. දීමනාව: බොහෝ විට 30, සමහරුන්ට 20. OT: 240 (සමහරුන්ට 200).': 'The basic salary is divided by these values. Allowance: usually 30, sometimes 20. OT: 240 (sometimes 200).',
    'OT පැයකට ගෙවන ස්ථාවර මුදල (රු.)': 'Fixed OT amount per hour (Rs.)',
    'අනුපාතයක් නොව නියත රේට් එකක් ගෙවන්නේ නම් පමණක් මෙහි ඇතුළත් කරන්න. 0 හෝ හිස් නම් ඉහත ÷ අනුපාතය භාවිතා වේ.': 'Enter this only if you are paid a fixed rate rather than a ratio. If 0 or blank, the ÷ ratio above is used.',
    'තවම සුරැකි වවුචර් නෑ. "මාසය" පිටුවේ "වවුචර් සකසන්න" බොත්තම ඔබන්න.': 'No saved vouchers yet. Press "Prepare vouchers" on the "Month" page.',
    'මූලික වැටුප ඇතුළත් කරන්න': 'Enter the basic salary',
    /* public holiday names */
    'දුරුතු පොහොය': 'Duruthu Poya', 'තමිල් තෛපොංගල් දිනය': 'Tamil Thai Pongal Day', 'නවම් පොහොය': 'Navam Poya', 'ජාතික නිදහස් දිනය': 'National Independence Day', 'මහා ශිවරාත්‍රි දිනය': 'Maha Sivarathri Day',
    'මැදින් පොහොය': 'Medin Poya', 'ඊද්-උල්-ෆිතර් (රාමසාන්)': 'Eid-ul-Fitr (Ramazan)', 'බක් පොහොය': 'Bak Poya', 'ශුභ සිකුරාදා': 'Good Friday', 'අලුත් අවුරුද්දට පෙර දිනය': 'Day before the New Year',
    'සිංහල හා දෙමළ අලුත් අවුරුද්ද': 'Sinhala and Tamil New Year', 'වෙසක් පොහොය / මැයි දිනය': 'Vesak Poya / May Day', 'වෙසක් පොහොයට පසු දිනය': 'Day after Vesak Poya', 'ඊද්-උල්-අල්හා (හජ්ජි)': 'Eid-ul-Alha (Hadji)',
    'අධික පොසොන් පොහොය': 'Adhi Poson Poya', 'පොසොන් පොහොය': 'Poson Poya', 'ඇසළ පොහොය': 'Esala Poya', 'මිලාද්-උන්-නබි': 'Milad-un-Nabi', 'නිකිණි පොහොය': 'Nikini Poya', 'බිනර පොහොය': 'Binara Poya',
    'වප් පොහොය': 'Vap Poya', 'දීපාවලි': 'Deepavali', 'ඉල් පොහොය': 'Il Poya', 'උඳුවප් පොහොය': 'Unduvap Poya', 'නත්තල': 'Christmas', 'මැයි දිනය': 'May Day', 'වෙසක් පොහොය': 'Vesak Poya',
    'රජයේ නිවාඩු දිනය': 'Public holiday'
  };
  const keys = Object.keys(SUB).sort((a, b) => b.length - a.length);
  const SI = /[඀-෿]/;
  function tr(s) {
    if (!s || !SI.test(s)) return s;
    const tt = s.trim();
    if (Object.prototype.hasOwnProperty.call(EXACT, tt)) return s.replace(tt, EXACT[tt]);
    for (const k of keys) if (s.indexOf(k) >= 0) s = s.split(k).join(SUB[k]);
    return s;
  }
  window.I18N = { tr, SUB, EXACT, add(o) { Object.assign(SUB, o); keys.length = 0; Object.keys(SUB).sort((a, b) => b.length - a.length).forEach((k) => keys.push(k)); } };
})();
