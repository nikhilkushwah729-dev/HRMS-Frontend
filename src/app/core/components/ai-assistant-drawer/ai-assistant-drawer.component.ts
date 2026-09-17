import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiEmployeeAssistantService } from '../../services/ai-employee-assistant.service';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

@Component({
  selector: 'app-ai-assistant-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating AI Trigger Button -->
    <button
      (click)="toggleDrawer()"
      class="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-3.5 rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-2 border border-slate-700 group focus:outline-none"
      title="Open AI HR Assistant"
    >
      <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 flex items-center justify-center text-white text-base shadow-md font-bold">
        ✨
      </div>
      <span class="text-xs font-bold tracking-wide pr-1 hidden sm:inline text-slate-200 group-hover:text-white">
        AI HR Assistant
      </span>
    </button>

    <!-- Slide-over AI Assistant Drawer Modal -->
    @if (isOpen()) {
      <div class="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
        <div class="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-100 overflow-hidden">
          
          <!-- Header -->
          <header class="p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 to-indigo-500 flex items-center justify-center text-white text-base font-bold shadow-md">
                ✨
              </div>
              <div>
                <h2 class="font-bold text-base text-white">AI HR Assistant</h2>
                <p class="text-xs text-slate-400">Ask about leaves, attendance, payroll & policies</p>
              </div>
            </div>
            <button
              (click)="toggleDrawer()"
              class="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </header>

          <!-- Suggested Quick Prompts -->
          <div class="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
            @for (prompt of suggestedPrompts; track prompt) {
              <button
                (click)="sendQuickPrompt(prompt)"
                class="px-2.5 py-1 text-[11px] font-semibold bg-white text-slate-700 hover:bg-primary-50 hover:text-primary-600 rounded-full border border-slate-200 transition-colors whitespace-nowrap shadow-2xs"
              >
                {{ prompt }}
              </button>
            }
          </div>

          <!-- Chat Conversation Body -->
          <div class="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            @for (msg of messages(); track msg.id) {
              <div
                class="flex flex-col gap-1"
                [ngClass]="msg.sender === 'user' ? 'items-end' : 'items-start'"
              >
                <div
                  class="max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs"
                  [ngClass]="
                    msg.sender === 'user'
                      ? 'bg-primary-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                  "
                >
                  <p class="whitespace-pre-line">{{ msg.text }}</p>
                </div>
                <span class="text-[10px] text-slate-400 font-medium px-1">
                  {{ msg.timestamp }}
                </span>
              </div>
            }

            @if (loading()) {
              <div class="flex items-start gap-2 text-slate-500 text-xs py-2">
                <div class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center animate-pulse">✨</div>
                <div class="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs">
                  <div class="flex items-center gap-1.5">
                    <div class="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce"></div>
                    <div class="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div class="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Input Footer -->
          <form (submit)="sendMessage($event)" class="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              [(ngModel)]="userQuery"
              name="userQuery"
              placeholder="Ask AI anything..."
              class="flex-1 bg-slate-50 text-slate-800 placeholder:text-slate-400 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary-500"
            />
            <button
              type="submit"
              [disabled]="!userQuery.trim() || loading()"
              class="bg-primary-600 text-white p-2.5 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `,
  ],
})
export class AiAssistantDrawerComponent {
  private aiAssistant = inject(AiEmployeeAssistantService);

  isOpen = signal(false);
  loading = signal(false);
  userQuery = '';

  suggestedPrompts = [
    'How do I request casual leave?',
    'What is the geofence attendance rule?',
    'How to claim meal expenses?',
    'Show HR onboarding guidelines',
  ];

  messages = signal<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hello! I am your organization AI HR Assistant. How can I assist you today with leaves, attendance, or claims?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  toggleDrawer() {
    this.isOpen.set(!this.isOpen());
  }

  sendQuickPrompt(prompt: string) {
    this.userQuery = prompt;
    this.sendMessage();
  }

  sendMessage(event?: Event) {
    if (event) event.preventDefault();
    const query = this.userQuery.trim();
    if (!query || this.loading()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add user message
    this.messages.update((msgs) => [
      ...msgs,
      { id: Date.now().toString(), sender: 'user', text: query, timestamp: time },
    ]);

    this.userQuery = '';
    this.loading.set(true);

    this.aiAssistant.queryAiAssistant(query).subscribe({
      next: (res) => {
        this.messages.update((msgs) => [
          ...msgs,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: res.data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.messages.update((msgs) => [
          ...msgs,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: 'I am here to assist with HR queries! Please check your internet connection or backend service status.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        this.loading.set(false);
      },
    });
  }
}
