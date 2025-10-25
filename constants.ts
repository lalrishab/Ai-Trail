import { Emotion, EmotionOption, Voice, VoiceOption } from './types';

export const EMOTIONS: EmotionOption[] = [
  {
    id: Emotion.Happy,
    label: 'Happy',
    promptPrefix: 'Say cheerfully',
  },
  {
    id: Emotion.Sad,
    label: 'Sad',
    promptPrefix: 'Say mournfully',
  },
  {
    id: Emotion.Fear,
    label: 'Fearful',
    promptPrefix: 'Say with fear',
  },
  {
    id: Emotion.Frightened,
    label: 'Frightened',
    promptPrefix: 'Say in a frightened tone',
  },
  {
    id: Emotion.Angry,
    label: 'Angry',
    promptPrefix: 'Say angrily',
  },
  {
    id: Emotion.Excited,
    label: 'Excited',
    promptPrefix: 'Say excitedly',
  },
];

export const VOICES: VoiceOption[] = [
  {
    id: Voice.Kore,
    label: 'Female',
    voiceName: Voice.Kore,
  },
  {
    id: Voice.Yadu,
    label: 'Indian Male',
    voiceName: Voice.Yadu,
  },
];
