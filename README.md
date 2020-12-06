# Adult Video Database
Manage your ever-growing video collection - add tags, performers, websites and have fun!

## Install application (Windows)
To install, run the executable file. After the first launch, go to your "AppData" directory (just write %appdata% in address bar).
Find the folder with the name of this application. The folder "userfiles" should appear in it.
Then you should download files ffmpeg.exe and ffprobe.exe. Maybe from here (https://github.com/FFmpeg/FFmpeg)
And then place this files into folder "ffmpeg" in "userfiles". 
Check the right way to files should be "C:\Users\UserName\AppData\Roaming\AVDB\userfiles\ffmpeg\"
And now you can scan folders from application! It's all.

- In portable version after the first launch, a folder "userdata" will be created in the folder with the executable file. Also need to copy files ffmpeg.exe and ffprobe.exe to the folder "userdata\userfiles\ffmpeg\"

### Support on other OS
Only Windows is supported. But if you are a developer, it may not be difficult for you to adapt the application for other operating systems. 
The application is made on electron. Paths should be responsive to the operating system. It remains to correctly add ffmpeg files that are needed to create a preview. 

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

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## Features

#### App
- Customizing colors, fonts
- Dark theme
- Backup management

#### Videos
- Scanning for videos in multiple folders, all known video formats are added.
- Information is automatically added to the video: performers, tags, websites.
- A thumb for the video is created. You can create a small video preview.
- Sorting and filtering by tags, websites, performers, filesize, quality, etc.
- Play video in app (if supported) or in a standard video player.
- Add markers to videos that are supported by the app.
- Change path to video.
- Custom thumb image.
- ... and more

#### Performers
- Adding several at a time
- Detailed profile
- Autosearch for information on the Internet.
- Ability to set 4 images for each, avatar, header
- Adding tags
- Sorting and filtering by all profile parameters
- ... and something else

#### Tags
- Adding several at a time
- Tag color
- Alternate names for better search
- Of course the tag image
- Sorting and filtering

#### Websites
- Adding several at a time
- Site color
- Networking several
- Site image
- Sorting and filtering

#### Bookmarks
- For all: tags, videos, performers, websites
- Filter by bookmarks

### View of app

#### Home 
![alt text](https://i.ibb.co/N66Hf6R/avdb-home.jpg)

#### Videos
![alt text](https://i.ibb.co/TvgcVLd/avdb-videos.jpg)

#### Performers
![alt text](https://i.ibb.co/0KLmFVf/avdb-performers.jpg)

#### Performer profile
![alt text](https://i.ibb.co/dgjQvPB/avdb-profile.jpg)
