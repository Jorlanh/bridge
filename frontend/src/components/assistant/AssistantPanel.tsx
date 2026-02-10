import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  X, 
  Zap, 
  GraduationCap, 
  LayoutDashboard, 
  HelpCircle, 
  Settings,
  Sparkles,
  ArrowRight,
  Volume2,
  VolumeX,
  Bot,
  Send,
  Loader2,
  MessageSquare
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { assistantApi, ChatMessage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const suggestions = [
  {
    icon: Zap,
    title: "Otimizar Fluxos",
    description: "3 automações podem ser melhoradas",
    action: "/dashboard",
  },
  {
    icon: GraduationCap,
    title: "Continuar Aprendendo",
    description: "Retome seu progresso na Academy",
    action: "/academy",
  },
  {
    icon: Sparkles,
    title: "Nova Automação",
    description: "Crie um novo fluxo inteligente",
    action: "/dashboard",
  },
];

const shortcuts = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: GraduationCap, label: "Academy", to: "/academy" },
  { icon: Zap, label: "Automações", to: "/dashboard" },
  { icon: HelpCircle, label: "Ajuda", to: "/" },
];

export function AssistantPanel({ isOpen, onClose }: AssistantPanelProps) {
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [volume, setVolume] = useState([50]);
  const [showSettings, setShowSettings] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Olá! Sou o Assistente BridgeAI. Como posso te ajudar hoje? Posso te orientar sobre funcionalidades da plataforma, sugerir otimizações ou responder suas dúvidas.",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastSpokenMessageIndex = useRef<number>(-1);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Função para falar texto usando Web Speech API
  const speakText = useCallback((text: string) => {
    // Parar qualquer fala anterior
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    if (!immersiveMode || !text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configurar voz em português brasileiro - priorizar pt-BR
    const voices = window.speechSynthesis.getVoices();
    
    // Primeiro, tentar encontrar uma voz específica pt-BR
    let ptBRVoice = voices.find(
      (voice) => voice.lang === "pt-BR" || voice.lang.startsWith("pt-BR")
    );
    
    // Se não encontrar, tentar qualquer voz pt
    if (!ptBRVoice) {
      ptBRVoice = voices.find(
        (voice) => voice.lang.startsWith("pt") && voice.lang.includes("BR")
      );
    }
    
    // Se ainda não encontrar, tentar qualquer voz pt
    if (!ptBRVoice) {
      ptBRVoice = voices.find(
        (voice) => voice.lang.startsWith("pt")
      );
    }
    
    // Se encontrar uma voz em português, usar ela
    if (ptBRVoice) {
      utterance.voice = ptBRVoice;
      utterance.lang = ptBRVoice.lang;
    } else {
      // Fallback: definir idioma como pt-BR mesmo sem voz específica
      utterance.lang = "pt-BR";
    }
    
    utterance.volume = volume[0] / 100; // Converter de 0-100 para 0-1
    utterance.rate = 0.95; // Velocidade ligeiramente mais lenta para melhor compreensão
    utterance.pitch = 1.0;

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [immersiveMode, volume]);

  // Carregar vozes quando disponíveis
  useEffect(() => {
    const loadVoices = () => {
      // Forçar carregamento das vozes
      const voices = window.speechSynthesis.getVoices();
      // Verificar se há vozes em português disponíveis
      const ptVoices = voices.filter((voice) => 
        voice.lang.includes("pt") || voice.lang.includes("PT")
      );
      if (ptVoices.length > 0) {
      }
    };
    
    // Carregar imediatamente
    loadVoices();
    
    // Carregar quando as vozes mudarem (alguns navegadores carregam assincronamente)
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Timeout para garantir que as vozes sejam carregadas (fallback)
    const timeout = setTimeout(loadVoices, 500);
    
    return () => clearTimeout(timeout);
  }, []);

  // Falar novas mensagens do assistente quando o modo imersivo estiver ativo
  useEffect(() => {
    if (immersiveMode && messages.length > 0) {
      const lastMessageIndex = messages.length - 1;
      const lastMessage = messages[lastMessageIndex];
      
      // Só falar se for uma nova mensagem do assistente que ainda não foi falada
      if (
        lastMessage.role === "assistant" && 
        lastMessage.content &&
        lastSpokenMessageIndex.current < lastMessageIndex
      ) {
        lastSpokenMessageIndex.current = lastMessageIndex;
        // Pequeno delay para garantir que a mensagem foi renderizada
        setTimeout(() => {
          speakText(lastMessage.content);
        }, 300);
      }
    }
  }, [messages, immersiveMode, speakText]);

  // Parar fala quando o modo imersivo é desativado
  useEffect(() => {
    if (!immersiveMode && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  }, [immersiveMode]);

  // Atualizar volume da fala em tempo real
  useEffect(() => {
    if (window.speechSynthesis.speaking && speechSynthesisRef.current) {
      speechSynthesisRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (chatMode && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, chatMode]);

  useEffect(() => {
    if (chatMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatMode]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await assistantApi.sendMessage(
        userMessage.content,
        conversationHistory
      );

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    adjustTextareaHeight(e.target);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-l border-cyan-500/20 shadow-2xl shadow-cyan-500/10 z-50 overflow-y-auto overflow-x-hidden flex flex-col"
          >
            {/* Header */}
            <div className="relative p-6 border-b border-slate-800">
              {/* Background glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan-500/10 blur-3xl" />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Mini robot */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/30 flex items-center justify-center">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Assistente BridgeAI</h2>
                    <p className="text-xs text-cyan-400">Online • Pronto para ajudar</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                    aria-label="Configurações"
                  >
                    <Settings className="w-5 h-5 text-slate-400" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                    aria-label="Fechar painel"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setChatMode(false)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  !chatMode
                    ? "text-cyan-400 border-b-2 border-cyan-400"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                <Sparkles className="w-4 h-4 inline-block mr-2" />
                Início
              </button>
              <button
                onClick={() => setChatMode(true)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  chatMode
                    ? "text-cyan-400 border-b-2 border-cyan-400"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                <MessageSquare className="w-4 h-4 inline-block mr-2" />
                Chat
              </button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              {/* Settings Section - Aparece em ambos os modos */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-slate-800"
                  >
                    <div className="bg-slate-800/50 p-5 border-b border-slate-700/50 space-y-4">
                      <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Configurações Avançadas
                      </h3>

                      {/* Immersive Mode */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                            {immersiveMode ? (
                              <Volume2 className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <VolumeX className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Modo Imersivo</p>
                            <p className="text-xs text-slate-400">Experiência premium com voz</p>
                          </div>
                        </div>
                        <Switch
                          checked={immersiveMode}
                          onCheckedChange={setImmersiveMode}
                        />
                      </div>

                      {/* Volume Control */}
                      <AnimatePresence>
                        {immersiveMode && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2 space-y-2">
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>Volume</span>
                                <span>{volume[0]}%</span>
                              </div>
                              <Slider
                                value={volume}
                                onValueChange={setVolume}
                                max={100}
                                step={1}
                                className="w-full"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <p className="text-xs text-slate-500 italic">
                        O Assistente BridgeAI foi criado para tornar sua experiência mais intuitiva e inteligente, respeitando seu ambiente de trabalho e seu foco.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {chatMode ? (
                <>
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <AnimatePresence>
                      {messages.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              message.role === "user"
                                ? "bg-cyan-500/20 text-white border border-cyan-500/30"
                                : "bg-slate-800/50 text-slate-200 border border-slate-700/50"
                            }`}
                          >
                            {message.role === "assistant" && (
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/30 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                </div>
                                <span className="text-xs text-cyan-400 font-medium">BridgeAI</span>
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-slate-800/50 rounded-2xl px-4 py-3 border border-slate-700/50">
                          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div className="border-t border-slate-800 p-4">
                    <div className="flex gap-2">
                      <textarea
                        ref={inputRef}
                        value={inputMessage}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
                        rows={1}
                        className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none overflow-y-auto"
                        style={{ maxHeight: "120px", minHeight: "40px" }}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-xl text-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="overflow-y-auto h-full p-6 space-y-6">

              {/* Suggestions */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Sugestões Inteligentes
                </h3>
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={suggestion.action}
                        onClick={onClose}
                        className="group flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-colors">
                          <suggestion.icon className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{suggestion.title}</p>
                          <p className="text-xs text-slate-400">{suggestion.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Quick Shortcuts */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-3">Atalhos Rápidos</h3>
                <div className="grid grid-cols-2 gap-3">
                  {shortcuts.map((shortcut, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                    >
                      <Link
                        to={shortcut.to}
                        onClick={onClose}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-cyan-500/30 hover:bg-slate-800/50 transition-all"
                      >
                        <shortcut.icon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-300">{shortcut.label}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Help Section */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl p-5 border border-cyan-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-1">Precisa de ajuda?</h4>
                    <p className="text-xs text-slate-400 mb-3">
                      Estou aqui para guiar você em cada etapa. Explore a plataforma ou inicie um módulo na Academy.
                    </p>
                        <button
                          onClick={() => setChatMode(true)}
                      className="inline-flex items-center gap-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                          Iniciar conversa
                      <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
