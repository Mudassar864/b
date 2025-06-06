import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Header from "@/components/layout/Header";
import { formatTimeAgo, generateInitials, truncateText } from "@/lib/utils";
import { Search } from "lucide-react";
import NativeBottomNavigation from "@/components/mobile/NativeBottomNavigation";
import { useAuth } from "@/hooks/useAuth";

// Interface para tipar os dados da conversa
interface Participant {
  id: number;
  name: string;
  profileImage: string | null;
}

interface Message {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  recipientId: number;
}

interface Conversation {
  id: number;
  participant1Id: number;
  participant2Id: number;
  lastMessageId: number | null;
  createdAt: string;
  participant?: Participant;
  lastMessage?: Message | null;
  unreadCount?: number; // Adicionado para manter compatibilidade
}

export default function ChatsListPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
  // Buscar conversas do usuário atual
  const { 
    data: conversations = [], 
    isLoading,
    isError
  } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!user?.id
  });

  // Debug logs
  console.log("[ChatsListPage] Dados recebidos:", conversations);
  console.log("[ChatsListPage] Usuário atual:", user?.id);
  console.log("[ChatsListPage] Loading:", isLoading);
  console.log("[ChatsListPage] Error:", isError);

  // Filtrar conversas pela consulta de pesquisa
  const filteredConversations = conversations.filter((conversation) => {
    const participant = conversation.participant;
    if (!participant) return false;
    
    return participant.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleChatClick = (conversationId: number) => {
    // Redirecionar para a página de chat com o ID da conversa
    setLocation(`/chat/${conversationId}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <Header 
        title="Mensagens" 
        showFilters={false}
      />
      
      {/* Search Box */}
      <div className="px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <Input
            type="text"
            placeholder="Buscar nas mensagens"
            className="pl-10 pr-4 py-2.5 w-full bg-gray-50 border-gray-200 rounded-full text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Main Content - Conversations List */}
      <main className="flex-grow pb-20">
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            // Loading state
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando conversas...</p>
            </div>
          ) : isError ? (
            // Error state
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <p className="text-gray-800 font-medium">Erro ao carregar conversas</p>
              <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                Não foi possível carregar suas conversas. Tente novamente mais tarde.
              </p>
            </div>
          ) : filteredConversations.length > 0 ? (
            // Conversations
            filteredConversations.map((conversation) => {
              const { participant, lastMessage } = conversation;
              // Usamos 0 como padrão para unreadCount se não estiver definido
              const unreadCount = conversation.unreadCount || 0;
              
              return (
                <div 
                  key={conversation.id}
                  className="px-4 py-3.5 flex items-start hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => handleChatClick(conversation.id)}
                >
                  <Avatar className="h-12 w-12 mr-3 flex-shrink-0">
                    {participant?.profileImage ? (
                      <AvatarImage 
                        src={participant.profileImage}
                        alt={participant.name} 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                        {generateInitials(participant?.name || 'Usuário')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-medium text-gray-900 truncate">{participant?.name || 'Usuário'}</h3>
                      {lastMessage && (
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {formatTimeAgo(lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <p className={`text-sm ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'} truncate`}>
                        {lastMessage ? truncateText(lastMessage.content, 65) : "Nenhuma mensagem ainda"}
                      </p>
                      
                      {unreadCount > 0 && (
                        <span className="ml-2 flex-shrink-0 bg-blue-600 text-white text-xs font-medium rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            // Empty state
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              {searchQuery ? (
                <>
                  <p className="text-gray-800 font-medium">Nenhuma conversa encontrada</p>
                  <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                    Não encontramos nenhuma conversa com "{searchQuery}". Tente com outros termos.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-800 font-medium">Sem mensagens no momento</p>
                  <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
                    As mensagens de outros usuários e tutores aparecerão aqui quando você iniciar conversas.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* Bottom Navigation */}
      <NativeBottomNavigation />
    </div>
  );
}
