export enum Emotion {
  Happy = 'Happy',
  Sad = 'Sad',
  Fear = 'Fear',
  Frightened = 'Frightened',
  Angry = 'Angry',
  Excited = 'Excited',
}

export interface EmotionOption {
  id: Emotion;
  label: string;
  promptPrefix: string;
}

export enum Voice {
  Kore = 'Kore',
  Yadu = 'Yadu',
}

export interface VoiceOption {
  id: Voice;
  label: string;
  voiceName: Voice;
}
