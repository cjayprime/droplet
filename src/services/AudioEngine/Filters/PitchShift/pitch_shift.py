## Droplet Pitch Shift Feature
## Elena Georgieva, 5/23/2021

import librosa
import soundfile as sf
import sys

def pitchshift(track, effect):
## Takes in an audio tracks and the name of an effect, returns a pitch changed version of the track and the sampling rate
## Effect names and sounds match those in TikTok
    a, fs = librosa.load(track)
    if (effect == "chipmunk"):
    	n_steps = 4
    if (effect == "helium"): 
    	n_steps = 11
    if (effect == "baritone"): 
    	n_steps = -4
    if (effect == "giant"):  
    	n_steps = -11

    a = librosa.effects.pitch_shift(a, fs, n_steps) 
    # print(n_steps)
    return a, fs

# Three demo tracks recorded by Elena
# ------------------------------ Commented out by Chijioke Nna --------------------------------
# track1 = "BobDylan.wav"
# track2 = "Alphabet.wav"
# track3 = "Laugh.wav"

# Try different combinations of a track and an effect:
# pitchshift_1, fs = pitchshift(track1, "baritone")
# sf.write('baritone_demo.wav', pitchshift_1, fs)

# pitchshift_2, fs = pitchshift(track2, "giant")
# sf.write('giant_demo.wav', pitchshift_2, fs)

# pitchshift_3, fs = pitchshift(track3, "helium")
# sf.write('helium_demo.wav', pitchshift_3, fs)

# pitchshift_4, fs = pitchshift(track2, "chipmunk")
# sf.write('chipmunk_demo.wav', pitchshift_4, fs)
# ------------------------------ Commented out by Chijioke Nna --------------------------------

type = sys.argv[1]
input = sys.argv[2]
output = sys.argv[3]
pitchshift_1, fs = pitchshift(input, type)
sf.write(output, pitchshift_1, fs)
print('success')
