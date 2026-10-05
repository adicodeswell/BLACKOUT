const fs = require('fs');
let text = fs.readFileSync('android/app/build.gradle', 'utf8');
text = text.replace(/dependencies {\n    def room_version = "2.6.1"\n    implementation "androidx.room:room-runtime:\$room_version"\n    annotationProcessor "androidx.room:room-compiler:\$room_version"\n    testImplementation "androidx.room:room-testing:\$room_version"\n\n    testImplementation 'junit:junit:4.13.2'/, "dependencies {\n    testImplementation 'junit:junit:4.13.2'");
fs.writeFileSync('android/app/build.gradle', text);
