import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Emotion, Voice } from './types';
import { EMOTIONS, VOICES } from './constants';
import { LoadingSpinner, PlayIcon, WarningIcon } from './components/icons';

// --- Audio Utility Functions ---
// These are defined outside the component to avoid re-creation on re-renders.

// Decodes a base64 string into a Uint8Array.
const decodeBase64 = (base64: string): Uint8Array => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Decodes raw PCM audio data into an AudioBuffer for playback.
const decodePcmData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};


// --- App Component ---

const App: React.FC = () => {
  const [text, setText] = useState<string>('Hello! I can speak with different emotions. Try selecting one below and generate audio.');
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion>(Emotion.Happy);
  const [selectedVoice, setSelectedVoice] = useState<Voice>(Voice.Kore);
  const [speakingRate, setSpeakingRate] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleGenerateSpeech = useCallback(async () => {
    if (!text.trim() || !process.env.API_KEY) {
      setError('Please enter text and ensure your API key is configured.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAudioBuffer(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const emotionOption = EMOTIONS.find(e => e.id === selectedEmotion);
      if (!emotionOption) {
        throw new Error('Invalid emotion selected.');
      }
      
      const prompt = `${emotionOption.promptPrefix}: ${text}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
              speakingRate: speakingRate,
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice },
              },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        throw new Error('No audio data received from the API.');
      }
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const audioBytes = decodeBase64(base64Audio);
      const decodedBuffer = await decodePcmData(audioBytes, audioContextRef.current, 24000, 1);
      setAudioBuffer(decodedBuffer);

    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [text, selectedEmotion, selectedVoice, speakingRate]);
  
  const playAudio = useCallback(() => {
    if (!audioBuffer || !audioContextRef.current) return;
    
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.start(0);
  }, [audioBuffer]);


  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl shadow-purple-500/10 p-6 sm:p-8 space-y-6">
          <header className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
              Emotional Text-to-Speech
            </h1>
            <p className="text-gray-400 mt-2">Powered by Gemini</p>
          </header>

          <div className="space-y-4">
            <label htmlFor="text-input" className="block text-sm font-medium text-gray-300">
              Enter your text
            </label>
            <textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type something to say..."
              className="w-full h-32 p-4 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 resize-none"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-medium text-gray-300">Choose an emotion</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {EMOTIONS.map((emotion) => (
                <button
                  key={emotion.id}
                  onClick={() => setSelectedEmotion(emotion.id)}
                  disabled={isLoading}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed
                    ${selectedEmotion === emotion.id
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                  {emotion.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-medium text-gray-300">Choose a voice</h2>
            <div className="grid grid-cols-2 gap-2">
              {VOICES.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice.id)}
                  disabled={isLoading}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed
                    ${selectedVoice === voice.id
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                  {voice.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <label htmlFor="speed-control" className="block text-sm font-medium text-gray-300">Adjust speed</label>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-400">Slower</span>
              <input
                id="speed-control"
                type="range"
                min="0.75"
                max="1.25"
                step="0.25"
                value={speakingRate}
                onChange={(e) => setSpeakingRate(parseFloat(e.target.value))}
                disabled={isLoading}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
              />
              <span className="text-xs text-gray-400">Faster</span>
            </div>
          </div>
          
          <div className="pt-2">
            <button
              onClick={handleGenerateSpeech}
              disabled={isLoading || !text.trim()}
              className="w-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-wait transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="w-5 h-5 mr-2" />
                  Generating...
                </>
              ) : (
                'Generate Speech'
              )}
            </button>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-900/50 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg flex items-center space-x-3">
              <WarningIcon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {audioBuffer && !isLoading && (
            <div className="mt-6 p-4 bg-gray-900 rounded-lg border border-gray-700 flex items-center justify-between animate-fade-in">
              <p className="text-sm text-gray-300 font-medium">Audio Generated Successfully</p>
              <button
                onClick={playAudio}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                <PlayIcon className="w-5 h-5" />
                <span>Play</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
