![GitHub issues](https://img.shields.io/github/issues/fupdec/adult-video-database?color=%233aca0a)
![GitHub closed issues](https://img.shields.io/github/issues-closed/fupdec/Adult-Video-Database?color=%23f44)
![GitHub commits since tagged version](https://img.shields.io/github/commits-since/fupdec/adult-video-database/v0.6.0-alpha?color=green)
![GitHub package.json version](https://img.shields.io/github/package-json/v/fupdec/Adult-Video-Database?color=blue)
![GitHub all releases](https://img.shields.io/github/downloads/fupdec/Adult-Video-Database/total?color=blueviolet)

<img align="left" width="110" height="110" src="./public/icons/icon.png">

# Adult Video Database
Manage your porn video collection - add performers, tags, websites and have fun!

## Sponsorship 
&#127828; Support app on <a target="_blank" href="https://www.patreon.com/avdb">Patreon</a>

## Install application (Windows)
To install, run the executable file. <br>
You can download the latest executable under <a target="_blank" href="https://github.com/fupdec/Adult-Video-Database/releases">Releases</a> on the right hand side of this page. <br>
After the first launch, go to your "AppData" directory (just write %appdata% in address bar). <br>
Find the folder with the name of this application "AVDB". The folder "userfiles" should appear in it. <br>
Then you should download <a target="_blank" href="https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-full.7z">archive</a> with FFmpeg <br>
Extract files ffmpeg.exe and ffprobe.exe from folder "bin" in archive and place this files into folder "ffmpeg" in "userfiles".  <br>
Check the right way to files should be "C:\Users\UserName\AppData\Roaming\AVDB\userfiles\ffmpeg\". <br>
And now you can scan videos from application! It's all.

## Built-in video player
You can play videos inside the app, add markers to videos, open playlists and more. For this you need: <br>
1) download and install VLC player. <a target="_blank" href="https://www.videolan.org/vlc/">Official page</a> <br>
2) a system variable must be registered in Windows Path. <br>
In the variable you need to register the path to the folder of the VLC player. <br>
By default it will be like "C:\Program Files\VideoLAN\VLC". <br>
This <a target="_blank" href="https://www.architectryan.com/2018/03/17/add-to-the-path-on-windows-10/">guide</a> can help you <br>

### Portable version
After the first launch, a folder "userdata" will be created in the folder with the executable file. <br>
Also need to copy files ffmpeg.exe and ffprobe.exe to the folder "userdata\userfiles\ffmpeg\"

### Linux and macOS support
If you are a developer, it may not be difficult for you to adapt the application for other operating systems. <br>
The application is made on electron. Paths should be responsive to the operating system.  <br>
It remains to correctly add ffmpeg files that are needed to create a preview.  <br>
Perhaps if there are a lot of people willing, I will port it for these systems. <br>

## Roadmap to Beta
~~VLC Video player~~ <br>
~~playlists~~
- save state of sort, favorite, bookmark 
- auto-update of data based on videos, performers, websites with the ability to customize the update interval
- add play mode shuffle, autoplay for player
- improve player usabilty
- improve stability and fix bugs

## Features

#### App
- Video player with time markers (New!)
- Tabs for easy browsing
- Flexible and convenient filter system for any parameter
- Password protection
- Backup management
- Customizing colors, fonts
- Dark theme
- Statistics about tags, websites (later video statistics will be added)
- Hover card label preview
- Checking for updates on start
- Optimized for one-handed use :)

#### Videos
- Playlists (New!)
- Video preview with image grid 3x3 (New!)
- Adding performers, tags, websites, rating, favorite, bookmark
- Sorting and filtering by performers, tags, websites, filesize, quality, folder, path etc.
- Save filters and sorting to a preset that can be loaded at any time or set as default
- Play video in app or in the system player selected by default
- Scanning for videos in multiple folders. Information is automatically added to the video: performers, tags, websites
- Video preview on hover (only supports formats that the HTML5 video tag can play)
- Detailed video information: filesize, duration, dimension, quality, filename, format, date added
- Creating video preview manually
- Replacing thumb for a video 
- Add markers to the video: tag, performer, favorite, bookmark
- Change paths of the videos
- Filesize of selected and all videos in the status bar
- ... and more

#### Performers
- Adding tags, rating, favorite, bookmark
- Detailed profile: aliases, category, career, age, country and many other parameters
- Add custom parameter (New!)
- Autosearch for information on the Internet and import data (Freeones, IAFD)
- Sorting and filtering by all profile parameters
- Save filters and sorting to a preset that can be loaded at any time or set as default
- Ability to set 4 images for each (main, alternate, 2 custom), avatar, header image on the performer page
- Beautiful performer page with descriptive profile information. Filtration of videos with a performer by tags from the video. A meter that is determined by the values of tags from the video.
- Adding several at a time
- Profile completion progress
- Edit performer info parameters in settings (the ability to add new parameters will be added later) 
- ... and something else

#### Tags
- Adding alternate names (for easy search), color, value (for a meter), favorite, bookmark
- Sorting and filtering
- Adding several at a time
- Of course the tag image

#### Websites
- Subnetting websites
- Adding color, favorite, bookmark
- Sorting and filtering
- Adding several at a time
- Website image

### View of app

#### Home 
![alt text](https://i.ibb.co/n7YvpBb/home.jpg)

#### Videos
![alt text](https://i.ibb.co/svb12st/videos.jpg)

#### Edit video and hovered label
![alt text](https://i.ibb.co/3sXK9ms/edit.jpg)

#### Performers
![alt text](https://i.ibb.co/s6wvvTf/performers.jpg)

#### Performer profile
![alt text](https://i.ibb.co/0GxRgWr/profile.jpg)

#### Find performer info
![alt text](https://i.ibb.co/x22DLWD/find.jpg)

#### Edit images of performer
![alt text](https://i.ibb.co/d24KFxM/images.jpg)

#### Performer details
![alt text](https://i.ibb.co/bLXfqhr/performer.jpg)

#### Performer details in dark mode with header image, context menu 
![alt text](https://i.ibb.co/MVskQpr/dark.jpg)

## Development

### Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run electron:serve
```

### Compiles and minifies for production
```
npm run electron:build
```

### Compiles and minifies for production (portable version)
```
npm run electron:build_portable
```
### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/)
