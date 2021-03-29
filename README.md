![GitHub issues](https://img.shields.io/github/issues/fupdec/adult-video-database?color=%233aca0a)
![GitHub closed issues](https://img.shields.io/github/issues-closed/fupdec/Adult-Video-Database?color=%23f44)
![GitHub commits since tagged version](https://img.shields.io/github/commits-since/fupdec/adult-video-database/v0.7.2-beta?color=green)
![GitHub package.json version](https://img.shields.io/github/package-json/v/fupdec/Adult-Video-Database?color=blue)
![GitHub all releases](https://img.shields.io/github/downloads/fupdec/Adult-Video-Database/total?color=blueviolet)

<img align="left" width="110" height="110" src="./public/icons/icon.png">

# Adult Video Database
Manage your porn video collection - add performers, tags, websites and have fun!

## Sponsorship and New Releases
Subscribe to &#128279;<a href="https://www.patreon.com/avdb">Patreon</a> to receive new releases and to support the development of the application.

## Community 
&#129489;&#127995;&#8205;&#129309;&#8205;&#129489;&#127996; You can discuss the application on reddit &#128279;<a href="https://www.reddit.com/r/avdb/">r/avdb</a> and &#128279;<a href="https://discord.gg/QSnXFvXZVh">Discord</a>

## Install application (Windows)
1) To install, run the executable file. <br>
You can download the latest executable under &#128279;<a href="https://github.com/fupdec/Adult-Video-Database/releases">Releases</a> on the right hand side of this page. <br>
2) After the first launch, go to your "AppData" directory (just write %appdata% in address bar). <br>
Find the folder with the name of this application "AVDB". The folder "userfiles" should appear in it. <br>
3) Then you should download &#128279;<a href="https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-full.7z">archive</a> with FFmpeg <br>
4) Extract files ffmpeg.exe and ffprobe.exe from folder "bin" in archive and place this files into folder "ffmpeg" in "userfiles".  <br>
Check the right way to files should be "C:\Users\UserName\AppData\Roaming\AVDB\userfiles\ffmpeg\". <br>
5) And now you can scan videos from application! It's all.

### Portable version (Windows)
After the first launch, a folder "userdata" will be created in the folder with the executable file. <br>
Also need to copy files ffmpeg.exe and ffprobe.exe to the folder "userdata\userfiles\ffmpeg\"

## Linux and macOS support
Will be in the near future. You can follow the news in any of the communities above.

## Built-in video player
You can play videos inside the app, add markers to videos, open playlists and more. <br>
!!! Important note: I had to abandon the VLC player, since to launch it I used the WebChimera.js framework, which does not work on Linux and Mac OS. <br>
If you used VLC player only for this application, then you can uninstall it from the system. <br> 
Now, to play video inside the application, HTML5 video player is used, which does not support some formats. <br>
Support for all formats will be in the near future.
### Guide for configuring the VLC player for releases v0.7.1 and older: <br>
1) download and install VLC player. &#128279;<a href="https://www.videolan.org/vlc/">Official page</a> <br>
2) a system variable must be registered in Windows Path. <br>
In the variable you need to register the path to the folder of the VLC player. <br>
By default it will be like "C:\Program Files\VideoLAN\VLC". <br>
This &#128279;<a href="https://www.architectryan.com/2018/03/17/add-to-the-path-on-windows-10/">guide</a> can help you <br>

## Features

### &#128421; App
- Video player with time markers
- Tabs for easy browsing
- Parsing metadata from videos
- Flexible and convenient filter system for any parameter
- Watching folders for new and lost videos
- Password protection
- Backup management
- Customizing colors, fonts
- Dark theme
- Statistics about tags, websites, performers and videos
- Hover card label preview
- Checking for updates on start and manual check in settings tab "about"
- The app does not track your personal data and does not send any personal data!

### &#128249; Videos
- Playlists
- Video preview with image grid 3x3
- Adding performers, tags, websites, rating, favorite, bookmark
- Sorting and filtering by performers, tags, websites, filesize, quality, folder, path etc.
- Play video in app or in the system player selected by default
- Scanning for videos in multiple folders. Information is automatically added to the video: performers, tags, websites
- Video preview on hover (only supports formats that the HTML5 video can play)
- Detailed video information: filesize, duration, dimension, quality, filename, format, date added
- Replacing thumb for a video 
- Add markers to the video: tag, performer, favorite, bookmark
- Change paths of the videos
- ... and more

### &#128110; Performers
- Adding tags, rating, favorite, bookmark
- Detailed profile: aliases, category, career, age, country and many other parameters
- Add custom parameter, edit default parameters in settings 
- Autosearch for information on the Internet and import data (Freeones, IAFD for now. more in the future)
- Sorting and filtering by all profile parameters
- Ability to set 4 images for each (main, alternate, 2 custom), avatar, header image on the performer page
- Beautiful performer page with descriptive profile information. Filtration of videos with a performer by tags from the video. 
- Adding several at a time
- Profile completion progress
- A meter that is determined by the values of tags from the video
- ... and something else

### &#127991; Tags
- Adding alternate names (for easy search), color, value (for a meter), favorite, bookmark, category
- Sorting and filtering
- Adding several at a time
- Of course the tag image

### &#127760; Websites
- Subnetting websites
- Adding color, favorite, bookmark
- Sorting and filtering
- Adding several at a time
- Website image

### &#128209; Playlists
- Default playlist "Watch later" 
- Adding to favorite
- Sorting and filtering
- Adding several at a time

## View of app

### Home 
![home](https://i.ibb.co/3p20KF6/home.png)

### Videos
![videos](https://i.ibb.co/fMzrzt1/videos.png)

### Edit video
![video-edit](https://i.ibb.co/MV8FgF4/video-edit.png)

### Performers
![performers](https://i.ibb.co/YZvJXfm/performers.png)

### Edit performer profile
![performer-edit](https://i.ibb.co/gzLfD1n/performer-edit.png)

### Edit images of performer
![performer-images](https://i.ibb.co/WHwgVSW/performer-images.png)

### Performer page
![performer-page](https://i.ibb.co/hfwJGY7/performer-page.png)

### Performer page in dark mode with an open profile 
![performer-page-open-profile](https://i.ibb.co/0hGC0h8/performer-page-open-profile.png)

### Websites
![websites](https://i.ibb.co/4PkHbzh/websites.png)

### Website
![website](https://i.ibb.co/QQGxWDH/website.png)

### Player
![player](https://i.ibb.co/tYPHjWz/player.png)