import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Search, Filter, Users, Clock, AlertCircle, CheckCircle, X, Plus } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { format } from 'date-fns';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI, customerAPI, employeeAPI } from '../services/api';
import './Chat.css';

const Chat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [typingUsers, setTypingUsers] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatForm, setNewChatForm] = useState({
    type: 'direct',
    businessUnit: 'general',
    title: '',
    description: '',
    participantId: '',
    participantName: '',
    participantType: 'customer'
  });
  const [participantSearch, setParticipantSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingParticipants, setSearchingParticipants] = useState(false);

  const messagesEndRef = useRef(null);
  const { connected, socket } = useWebSocket();
  const { info, success, error: showError } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    fetchConversations();
  }, [filterType, filterStatus]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.conversationId);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket subscriptions
  useEffect(() => {
    if (!connected || !socket) return;

    // Subscribe to admin chat updates
    socket.emit('subscribe-admin-chat');

    // Listen for new messages
    socket.on('message:new', handleNewMessage);

    // Listen for conversation updates
    socket.on('conversation:created', handleConversationCreated);
    socket.on('conversation:updated', handleConversationUpdated);

    // Listen for typing indicators
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stopped-typing', handleUserStoppedTyping);

    return () => {
      socket.off('message:new');
      socket.off('conversation:created');
      socket.off('conversation:updated');
      socket.off('user-typing');
      socket.off('user-stopped-typing');
    };
  }, [connected, socket, selectedConversation]);

  const handleNewMessage = (data) => {
    const { conversationId, message } = data;

    // Update messages if it's the selected conversation
    if (selectedConversation?.conversationId === conversationId) {
      setMessages(prev => [...prev, message]);

      // Mark as read
      chatAPI.markAsRead(conversationId, { userId: user?.employeeId || 'admin' });
    }

    // Update conversation in list
    setConversations(prev => prev.map(conv =>
      conv.conversationId === conversationId
        ? { ...conv, lastMessage: data.conversation?.lastMessage }
        : conv
    ));

    // Show notification if not current conversation
    if (selectedConversation?.conversationId !== conversationId) {
      info(`New message from ${message.senderName}`, 3000);
    }
  };

  const handleConversationCreated = ({ conversation }) => {
    setConversations(prev => [conversation, ...prev]);
    info('New conversation started', 2000);
  };

  const handleConversationUpdated = ({ conversation }) => {
    setConversations(prev => prev.map(conv =>
      conv.conversationId === conversation.conversationId ? conversation : conv
    ));
  };

  const handleUserTyping = ({ conversationId, userId, userName }) => {
    if (selectedConversation?.conversationId === conversationId && userId !== user?.employeeId) {
      setTypingUsers(prev => [...new Set([...prev, userName])]);

      // Clear typing indicator after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(name => name !== userName));
      }, 3000);
    }
  };

  const handleUserStoppedTyping = ({ conversationId, userId }) => {
    if (selectedConversation?.conversationId === conversationId) {
      setTypingUsers([]);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);

      const params = {};
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (searchQuery) params.search = searchQuery;

      const response = await chatAPI.getAllConversations(params);
      setConversations(response?.conversations || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      showError('Failed to load conversations');
      setLoading(false);
      setConversations([]);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await chatAPI.getMessages(conversationId);
      setMessages(response?.messages || []);

      // Mark as read
      await chatAPI.markAsRead(conversationId, { userId: user?.employeeId || 'admin' });

      // Join conversation room
      if (socket) {
        socket.emit('join-conversation', conversationId);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      showError('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || sendingMessage) return;

    try {
      setSendingMessage(true);

      const response = await chatAPI.sendMessage(selectedConversation.conversationId, {
        senderId: user?.employeeId || 'admin',
        senderType: 'admin',
        senderName: user?.name || 'Admin',
        content: messageInput.trim(),
        messageType: 'text'
      });

      // Optimistically add the message to the UI
      const newMessage = response?.message;
      if (newMessage) {
        setMessages(prev => [...prev, newMessage]);
      }

      setMessageInput('');

      // Stop typing indicator
      if (socket) {
        socket.emit('typing-stop', {
          conversationId: selectedConversation.conversationId,
          userId: user?.employeeId || 'admin'
        });
      }

      setSendingMessage(false);
    } catch (err) {
      console.error('Failed to send message:', err);
      showError('Failed to send message');
      setSendingMessage(false);
    }
  };

  const handleTyping = () => {
    if (!socket || !selectedConversation) return;

    socket.emit('typing-start', {
      conversationId: selectedConversation.conversationId,
      userId: user?.employeeId || 'admin',
      userName: user?.name || 'Admin'
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getConversationTitle = (conversation) => {
    if (conversation.title) return conversation.title;

    const otherParticipants = conversation.participants.filter(
      p => p.userId !== user?.employeeId
    );

    if (otherParticipants.length === 1) {
      return otherParticipants[0].name;
    } else if (otherParticipants.length > 1) {
      return `${otherParticipants[0].name} + ${otherParticipants.length - 1} others`;
    }

    return 'Conversation';
  };

  const filteredConversations = conversations.filter(conv => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = getConversationTitle(conv).toLowerCase();
      const lastMsg = conv.lastMessage?.content?.toLowerCase() || '';
      return title.includes(query) || lastMsg.includes(query);
    }
    return true;
  });

  const loadAllParticipants = async () => {
    try {
      setSearchingParticipants(true);
      const params = { limit: 50 }; // Load first 50 participants

      if (newChatForm.participantType === 'customer') {
        const response = await customerAPI.getAll(params);
        const customers = response?.customers || [];
        setSearchResults(
          customers.map((c) => ({
            id: c._id,
            displayCode: c.customerId,
            name: `${c.firstName} ${c.lastName}`,
            email: c.email,
            type: 'customer'
          }))
        );
      } else {
        const response = await employeeAPI.getAll(params);
        const employees = response?.employees || [];
        setSearchResults(
          employees.map((e) => ({
            id: e._id,
            displayCode: e.employeeId,
            name: e.name,
            email: e.email,
            type: 'employee'
          }))
        );
      }
      setSearchingParticipants(false);
    } catch (err) {
      console.error('Failed to load participants:', err);
      setSearchingParticipants(false);
      setSearchResults([]);
    }
  };

  const searchParticipants = async (query) => {
    // If query is empty or too short, load all participants
    if (!query || query.length < 2) {
      loadAllParticipants();
      return;
    }

    try {
      setSearchingParticipants(true);
      const params = { search: query, limit: 50 };

      if (newChatForm.participantType === 'customer') {
        const response = await customerAPI.getAll(params);
        const customers = response?.customers || [];
        setSearchResults(
          customers.map((c) => ({
            id: c._id,
            displayCode: c.customerId,
            name: `${c.firstName} ${c.lastName}`,
            email: c.email,
            type: 'customer'
          }))
        );
      } else {
        const response = await employeeAPI.getAll(params);
        const employees = response?.employees || [];
        setSearchResults(
          employees.map((e) => ({
            id: e._id,
            displayCode: e.employeeId,
            name: e.name,
            email: e.email,
            type: 'employee'
          }))
        );
      }
      setSearchingParticipants(false);
    } catch (err) {
      console.error('Failed to search participants:', err);
      setSearchingParticipants(false);
      setSearchResults([]);
    }
  };

  const selectParticipant = (participant) => {
    setNewChatForm({
      ...newChatForm,
      participantId: participant.id,
      participantName: participant.name
    });
    setParticipantSearch(participant.name);
    setSearchResults([]);
  };

  const handleCreateConversation = async () => {
    try {
      if (!newChatForm.participantId || !newChatForm.participantName) {
        showError('Please select a participant');
        return;
      }

      const conversationData = {
        type: newChatForm.type,
        businessUnit: newChatForm.businessUnit,
        title: newChatForm.title || `Chat with ${newChatForm.participantName}`,
        description: newChatForm.description,
        participants: [
          {
            userId: user?.employeeId || 'admin',
            userType: 'admin',
            name: user?.name || 'Admin'
          },
          {
            userId: newChatForm.participantId,
            userType: newChatForm.participantType,
            name: newChatForm.participantName
          }
        ]
      };

      const response = await chatAPI.createConversation(conversationData);
      const newConversation = response?.conversation;

      if (newConversation) {
        setConversations(prev => [newConversation, ...prev]);
        setSelectedConversation(newConversation);
        setShowNewChatModal(false);
        setNewChatForm({
          type: 'direct',
          businessUnit: 'general',
          title: '',
          description: '',
          participantId: '',
          participantName: '',
          participantType: 'customer'
        });
        setParticipantSearch('');
        setSearchResults([]);
        success('Conversation created successfully!');
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
      showError('Failed to create conversation');
    }
  };

  return (
    <Layout title="Chat" subtitle="Manage conversations across all business units">
      <div className="chat-container">
        <div className="chat-sidebar">
          <Card className="conversations-card">
            <div className="conversations-header">
              <div className="conversations-header-left">
                <h3>Conversations</h3>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setShowNewChatModal(true)}
                >
                  New Chat
                </Button>
              </div>
            </div>

            <div className="conversations-search">
              <div className="search-input-wrapper">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="conversations-filters">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="customer_support">Support</option>
                <option value="staff_chat">Staff</option>
                <option value="group">Group</option>
                <option value="direct">Direct</option>
              </select>

              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="conversations-list">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading conversations...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="empty-state">
                  <MessageSquare size={48} />
                  <p>No conversations found</p>
                </div>
              ) : (
                filteredConversations.map(conversation => {
                  const hasUnread = conversation.unreadCounts && conversation.unreadCounts[user?.employeeId] > 0;
                  return (
                  <div
                    key={conversation.conversationId}
                    className={`conversation-item ${
                      selectedConversation?.conversationId === conversation.conversationId
                        ? 'active'
                        : ''
                    } ${hasUnread ? 'has-unread' : ''}`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="conversation-avatar">
                      {hasUnread && <span className="unread-indicator"></span>}
                      {conversation.type === 'group' ? <Users size={20} /> : <MessageSquare size={20} />}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-title-row">
                        <span className="conversation-title">
                          {getConversationTitle(conversation)}
                        </span>
                        {conversation.lastMessage?.timestamp && (
                          <span className="conversation-time">
                            {format(new Date(conversation.lastMessage.timestamp), 'HH:mm')}
                          </span>
                        )}
                      </div>
                      <div className="conversation-preview-row">
                        <span className="conversation-preview">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </span>
                        {conversation.unreadCounts && conversation.unreadCounts[user?.employeeId] > 0 && (
                          <Badge variant="primary" className="unread-badge">
                            {conversation.unreadCounts[user?.employeeId]}
                          </Badge>
                        )}
                      </div>
                      <div className="conversation-meta">
                        <Badge variant={conversation.type}>{conversation.type}</Badge>
                        {conversation.businessUnit && (
                          <Badge variant={conversation.businessUnit}>{conversation.businessUnit}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        <div className="chat-main">
          {selectedConversation ? (
            <Card className="messages-card">
              <div className="messages-header">
                <div>
                  <h3>{getConversationTitle(selectedConversation)}</h3>
                  <div className="messages-header-meta">
                    <Badge variant={selectedConversation.type}>{selectedConversation.type}</Badge>
                    {selectedConversation.businessUnit && (
                      <Badge variant={selectedConversation.businessUnit}>
                        {selectedConversation.businessUnit}
                      </Badge>
                    )}
                    <span className="participants-count">
                      {selectedConversation.participants.length} participants
                    </span>
                  </div>
                </div>
              </div>

              <div className="messages-container">
                {messages.map((message) => (
                  <div
                    key={message.messageId}
                    className={`message ${
                      message.senderId === user?.employeeId ? 'message-sent' : 'message-received'
                    }`}
                  >
                    <div className="message-avatar">
                      {message.senderName.charAt(0).toUpperCase()}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-sender">{message.senderName}</span>
                        <span className="message-time">
                          {format(new Date(message.createdAt), 'HH:mm')}
                        </span>
                      </div>
                      <div className="message-text">{message.content}</div>
                      {message.status === 'read' && message.senderId === user?.employeeId && (
                        <div className="message-status">
                          <CheckCircle size={14} /> Read
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {typingUsers.length > 0 && (
                  <div className="typing-indicator">
                    <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="message-input-container">
                <textarea
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  rows={2}
                />
                <Button
                  variant="primary"
                  icon={Send}
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendingMessage}
                  loading={sendingMessage}
                >
                  Send
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="empty-chat-state">
              <MessageSquare size={64} />
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the list to start chatting</p>
            </Card>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Start New Conversation</h3>
              <button className="modal-close" onClick={() => setShowNewChatModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Conversation Type</label>
                <select
                  value={newChatForm.type}
                  onChange={(e) => setNewChatForm({ ...newChatForm, type: e.target.value })}
                >
                  <option value="direct">Direct Message</option>
                  <option value="customer_support">Customer Support</option>
                  <option value="staff_chat">Staff Chat</option>
                  <option value="group">Group Chat</option>
                </select>
              </div>

              <div className="form-group">
                <label>Business Unit</label>
                <select
                  value={newChatForm.businessUnit}
                  onChange={(e) => setNewChatForm({ ...newChatForm, businessUnit: e.target.value })}
                >
                  <option value="general">General</option>
                  <option value="gym">The Ring (Gym)</option>
                  <option value="spa">The Olive Room (Spa)</option>
                  <option value="manufacturing">The Edit Collection</option>
                  <option value="childcare">The Women's Den (Childcare)</option>
                  <option value="marketing">TWD Marketing</option>
                </select>
              </div>

              <div className="form-group">
                <label>Participant Type</label>
                <select
                  value={newChatForm.participantType}
                  onChange={(e) => {
                    setNewChatForm({
                      ...newChatForm,
                      participantType: e.target.value,
                      participantId: '',
                      participantName: ''
                    });
                    setParticipantSearch('');
                    setSearchResults([]);
                  }}
                >
                  <option value="customer">Customer</option>
                  <option value="employee">Employee</option>
                </select>
              </div>

              <div className="form-group participant-search-group">
                <label>Select Participant *</label>
                <input
                  type="text"
                  placeholder={`Search or select ${newChatForm.participantType}...`}
                  value={participantSearch}
                  onChange={(e) => {
                    setParticipantSearch(e.target.value);
                    searchParticipants(e.target.value);
                  }}
                  onFocus={() => {
                    if (searchResults.length === 0 && !newChatForm.participantId) {
                      loadAllParticipants();
                    }
                  }}
                  autoComplete="off"
                />
                {searchingParticipants && (
                  <div className="search-loading">Loading {newChatForm.participantType}s...</div>
                )}
                {!searchingParticipants && searchResults.length > 0 && (
                  <div className="search-results-dropdown">
                    {searchResults.map((participant) => (
                      <div
                        key={participant.id}
                        className="search-result-item"
                        onClick={() => selectParticipant(participant)}
                      >
                        <div className="participant-info">
                          <div className="participant-name">{participant.name}</div>
                          <div className="participant-meta">
                            {(participant.displayCode ??
                              participant.id?.toString().slice(-6))}{' '}
                            • {participant.email}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!searchingParticipants && participantSearch && searchResults.length === 0 && !newChatForm.participantId && (
                  <div className="search-no-results">
                    No {newChatForm.participantType}s found matching "{participantSearch}"
                  </div>
                )}
                {newChatForm.participantId && newChatForm.participantName && (
                  <div className="selected-participant">
                    <strong>Selected:</strong> {newChatForm.participantName} (
                    {searchResults.find(
                      (p) => p.id === newChatForm.participantId
                    )?.displayCode || newChatForm.participantId})
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Membership Inquiry"
                  value={newChatForm.title}
                  onChange={(e) => setNewChatForm({ ...newChatForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  placeholder="Brief description of the conversation topic"
                  value={newChatForm.description}
                  onChange={(e) => setNewChatForm({ ...newChatForm, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setShowNewChatModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateConversation}>
                Create Conversation
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Chat;
