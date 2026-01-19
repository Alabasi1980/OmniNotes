import { Component, output, signal, OnDestroy, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-voice-recorder',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="flex items-center gap-2">
      <button 
        type="button" 
        (click)="toggleRecording()" 
        class="p-2 rounded-full transition-all duration-300 flex items-center justify-center w-8 h-8"
        [class.bg-red-500]="isRecording()"
        [class.text-white]="isRecording()"
        [class.hover:bg-white/10]="!isRecording()"
        [class.text-app-muted]="!isRecording()"
        [title]="isRecording() ? t.translate('STOP_REC') : t.translate('VOICE_MEMO')"
      >
        @if (!isRecording()) {
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-14 0m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
        } @else {
          <div class="w-3 h-3 bg-white rounded-sm animate-pulse"></div>
        }
      </button>
      @if (isRecording()) {
        <span class="text-xs font-mono text-red-400 animate-pulse">{{ recordingTime() | number: '1.0-0' }}s</span>
      }
    </div>
  `,
})
export class VoiceRecorderComponent implements OnDestroy {
  t = inject(TranslationService);
  
  audioFile = output<File>();
  isRecording = signal(false);
  recordingTime = signal(0);

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private timerInterval: any;

  async toggleRecording() {
    if (this.isRecording()) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = event => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const fileName = `voice-memo-${new Date().toISOString()}.webm`;
        const file = new File([audioBlob], fileName, { type: 'audio/webm' });
        this.audioFile.emit(file);
        
        this.reset();
        stream.getTracks().forEach(track => track.stop()); // Release microphone
      };
      
      this.audioChunks = [];
      this.mediaRecorder.start();
      this.isRecording.set(true);
      this.startTimer();

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access was denied. Please allow it in your browser settings.");
    }
  }

  private stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  private startTimer() {
    this.recordingTime.set(0);
    this.timerInterval = setInterval(() => {
      this.recordingTime.update(t => t + 1);
    }, 1000);
  }

  private reset() {
    this.isRecording.set(false);
    clearInterval(this.timerInterval);
    this.recordingTime.set(0);
  }

  ngOnDestroy() {
    this.stopRecording();
    clearInterval(this.timerInterval);
  }
}
