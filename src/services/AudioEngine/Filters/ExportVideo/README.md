
    COMBINED VERSION OF ALL COMMANDS BELOW
    ------------------
    ffmpeg -i "input.mp4" -i "dp.jpg" -i "mask.png" -filter_complex [0]drawtext="fontfile=Montserrat-Bold.ttf:text='@username': fontcolor=white:fontsize=44: box=1: boxcolor=black@0.0: boxborderw=5:x=(w-text_w)/2: y=580"[drawusername],[drawusername]drawtext="fontfile=Montserrat-Regular.ttf:text='sample caption':fontcolor=white: fontsize=34: x=(w-text_w)/2: y=650"[drawcaption],[1]scale=185:185[dp];[2]alphaextract[alfa];[dp][alfa]alphamerge[makecircular],[drawcaption][makecircular]overlay=444:306[applyprofilepicture] -map "[applyprofilepicture]" -hide_banner -pix_fmt yuv420p -codec:a copy applyprofilepic.mp4
    &&
    (ffmpeg -i applyprofilepic.mp4 -i audio.mp3 -map 0:v:0 -map 1:a:0 -shortest -strict -2 finaloutput.mp4
    || ffmpeg -i applyprofilepic.mp4 -i audio.mp3 -map 0:v -map 1:a -c:v copy -shortest -strict -2 finaloutput.mp4)


    ffmpeg -i input.mp4 -i "dp.jpg" -i "mask.png" -filter_complex [0]drawtext="fontfile=Montserrat-Bold.ttf:text='@username': fontcolor=white:fontsize=44: box=1: boxcolor=black@0.0: boxborderw=5:x=(w-text_w)/2: y=580"[drawusername],[drawusername]drawtext="fontfile=Montserrat-Regular.ttf:text='inse':fontcolor=white: fontsize=34: x=(w-text_w)/2: y=650"[drawcaption],[1]scale=185:185[dp];[2]alphaextract[alfa];[dp][alfa]alphamerge[makecircular],[drawcaption][makecircular]overlay=444:306[applyprofilepicture] -map "[applyprofilepicture]" -hide_banner -pix_fmt yuv420p -codec:a copy applyprofilepic.mp4 && ffmpeg -i applyprofilepic.mp4 -i audio.mp3 -map 0:v -map 1:a-c:v copy -shortest -strict -2 finaloutput.mp4
    
    
    _____________________________________________________________________________________________________


    ORIGINAL COMMANDS
    ------------------
    Execute this command to add username to the video (replace @username with the actual username)
    ffmpeg -i input.mp4 -vf drawtext="fontfile=Montserrat-Bold.ttf:text='@username': fontcolor=white:fontsize=44: box=1: boxcolor=black@0.0: boxborderw=5:x=(w-text_w)/2: y=580" -codec:a copy output.mp4

    Add the caption to the video
    ffmpeg -i output.mp4 -vf drawtext="fontfile=Montserrat-Regular.ttf:text='insert str variable here characters':fontcolor=white: fontsize=34: x=(w-text_w)/2: y=650" -codec:a copy output2.mp4


    Apply and scale the profile picture
    Scale the profile picture
    ffmpeg -hide_banner  -i "dp.jpg" -i "mask.png" -filter_complex"[0]scale=185:185[dp];[1]alphaextract[alfa];[dp][alfa]alphamerge"circle_dp.png

    Apply the profile picture
    fmpeg -i output2.mp4 -i circle_dp.png -filter_complex"[0:v][1:v] overlay=444:306" -pix_fmt yuv420p -c:acopy output3.mp4

    Adding audio background sound
    ffmpeg -i output.mp4 -i audio.mp3 -map 0:v -map 1:a-c:v copy -shortest -strict -2 finaloutput.mp4