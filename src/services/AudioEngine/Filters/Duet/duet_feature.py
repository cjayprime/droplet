## Droplet Duet Feature
## Elena Georgieva, 4/25/2021

import librosa
import IPython.display as ipd
import numpy as np
import soundfile as sf
import sys, getopt

def duet(track1, track2):
## Takes in 2 audio tracks, returns a duet of both tracks and the sampling rate
    a, fs = librosa.load(track1)
    b, fs = librosa.load(track2) 
    length = 0
    if (len(a) > len(b)):
        length = len(a)
        b = np.concatenate ([b, np.zeros(length-len(b))])
    else:
        length = len(b)
        a = np.concatenate ([a, np.zeros(length-len(a))])
    both = a[0:length] + b[0:length]
    return both, fs

# ------------------------ Commented out by Chijioke Nna ------------------------
# track1 = "birds.wav"
# track2 = "ocean.wav"
# sf.write('duet.wav', duet_audio, fs)
# ------------------------ Commented out by Chijioke Nna ------------------------

track1 = sys.argv[1]
track2 = sys.argv[2]
path = sys.argv[3]
duet_audio, fs = duet(track1, track2)
sf.write(path, duet_audio, fs)
print('success')
