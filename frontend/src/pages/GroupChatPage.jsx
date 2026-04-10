import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckSquare,
  FileText,
  Paperclip,
  Pin,
  Send,
  Sparkles,
  Upload,
  Users,
  Vote,
  X
} from 'lucide-react';
import GroupChatMessageCard from '../components/GroupChatMessageCard';
import GroupChatReplyReference from '../components/GroupChatReplyReference';
import GroupChatSidebarSection from '../components/GroupChatSidebarSection';
import GroupChatToolbarButton from '../components/GroupChatToolbarButton';
import { useAuth } from '../context/AuthContext';

const initialPollState = {
  question: '',
  options: ['', '']
};

const initialShareFileState = {
  name: '',
  note: '',
  selectedFile: null
};

const initialFileEditState = {
  name: '',
  url: '',
  note: ''
};

const initialTaskState = {
  title: ''
};

function ActionModal({ isOpen, title, onClose, children, footer }) {
  const titleId = `${title.toLowerCase().replace(/\s+/g, '-')}-title`;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="mx-4 w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 id={titleId} className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="rounded-xl p-1.5 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <span className="text-xl leading-none">x</span>
          </button>
        </div>
        <div className="space-y-4 p-6">{children}</div>
        <div className="px-6 pb-6">{footer}</div>
      </div>
    </div>
  );
}

const formatTimestamp = (value) =>
  new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

const formatFileSize = (size = 0) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getMessagePreview = (message) => {
  if (message.type === 'task') return message.task?.title || 'Task';
  if (message.type === 'poll') return message.poll?.question || 'Poll';
  if (message.type === 'file') return message.file?.name || 'Shared file';
  return message.content || 'Message';
};

const typingText = (typingUsers) => {
  if (typingUsers.length === 0) return '';
  if (typingUsers.length === 1) return `${typingUsers[0].name} is typing...`;
  if (typingUsers.length === 2) {
    return `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`;
  }

  return `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing...`;
};

function HighlightedContent({ content, mentions }) {
  if (!content) return null;

  const mentionLookup = new Map(
    (mentions || []).map((mention) => [`@${mention.itNumber.toUpperCase()}`, mention])
  );
  const parts = [];
  const regex = /@([A-Za-z0-9]+)/g;
  let lastIndex = 0;
  let match = regex.exec(content);

  while (match) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const originalToken = match[0];
    const normalizedToken = `@${match[1].toUpperCase()}`;

    if (mentionLookup.has(normalizedToken)) {
      parts.push(
        <span
          key={`${normalizedToken}-${match.index}`}
          className="text-blue-700 font-medium"
        >
          {originalToken}
        </span>
      );
    } else {
      parts.push(originalToken);
    }

    lastIndex = match.index + originalToken.length;
    match = regex.exec(content);
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700">{parts}</p>;
}

export default function GroupChatPage() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id;

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [pollState, setPollState] = useState(initialPollState);
  const [fileState, setFileState] = useState(initialShareFileState);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editFileState, setEditFileState] = useState(initialFileEditState);
  const [editPollState, setEditPollState] = useState(initialPollState);
  const [editTaskState, setEditTaskState] = useState(initialTaskState);
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [isFileDragActive, setIsFileDragActive] = useState(false);
  const [mentionState, setMentionState] = useState({ visible: false, query: '', start: -1, end: -1 });
  const [summaryNotice, setSummaryNotice] = useState('');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageRefs = useRef({});
  const highlightTimeoutRef = useRef(null);
  const composerRef = useRef(null);
  const shouldAutoScrollRef = useRef(false);

  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  };

  const isGroupAdmin = String(group?.creator?._id || group?.creator) === String(currentUserId);

  const isMessageSender = (message) =>
    String(message.sender?._id || message.sender) === String(currentUserId);

  const canDeleteMessage = (message) =>
    isMessageSender(message) || isGroupAdmin;

  const closeMentionSuggestions = () => {
    setMentionState({ visible: false, query: '', start: -1, end: -1 });
  };

  const clearReplyTarget = () => {
    setReplyingTo(null);
  };

  const resetFileShareState = () => {
    setFileState(initialShareFileState);
    setIsFileDragActive(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectedFile = (selectedFile) => {
    if (!selectedFile) return;

    setFileState((previousState) => ({
      ...previousState,
      selectedFile,
      name: previousState.name.trim() ? previousState.name : selectedFile.name
    }));
    setModalError('');
  };

  const handleFileInputChange = (event) => {
    handleSelectedFile(event.target.files?.[0]);
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    setIsFileDragActive(false);
    handleSelectedFile(event.dataTransfer.files?.[0]);
  };

  const handleFileDragOver = (event) => {
    event.preventDefault();
    setIsFileDragActive(true);
  };

  const handleFileDragLeave = (event) => {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    setIsFileDragActive(false);
  };

  const fetchChat = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const response = await fetch(`/api/groups/${groupId}/chat`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load group chat');
      }

      setGroup(data.group);
      setMessages(data.messages || []);
      setPinnedMessages(data.pinnedMessages || []);
      setSharedFiles(data.sharedFiles || []);
      setTasks(data.tasks || []);
      setTypingUsers(data.typingUsers || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchChat();

    pollIntervalRef.current = setInterval(() => {
      fetchChat(true);
    }, 5000);

    return () => {
      clearInterval(pollIntervalRef.current);
    };
  }, [groupId]);

  useEffect(() => {
    if (!shouldAutoScrollRef.current || messages.length === 0) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    shouldAutoScrollRef.current = false;
  }, [messages]);

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      fetch(`/api/groups/${groupId}/chat/typing`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ isTyping: false })
      }).catch(() => {});
    };
  }, [groupId]);

  useEffect(() => {
    if (!summaryNotice) return undefined;

    const timeoutId = setTimeout(() => {
      setSummaryNotice('');
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [summaryNotice]);

  useEffect(() => () => {
    clearTimeout(highlightTimeoutRef.current);
  }, []);

  useEffect(() => {
    clearReplyTarget();
    setHighlightedMessageId(null);
    clearTimeout(highlightTimeoutRef.current);
  }, [groupId]);

  useEffect(() => {
    if (!mentionState.visible) return undefined;

    const handlePointerDown = (event) => {
      if (composerRef.current && !composerRef.current.contains(event.target)) {
        closeMentionSuggestions();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeMentionSuggestions();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mentionState.visible]);

  const sendTypingStatus = async (isTyping) => {
    try {
      await fetch(`/api/groups/${groupId}/chat/typing`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ isTyping })
      });
    } catch (err) {
      console.error('Typing status error:', err);
    }
  };

  const updateMentionState = (value, cursorPosition) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const match = textBeforeCursor.match(/(^|\s)@([A-Za-z0-9]*)$/);

    if (!match) {
      closeMentionSuggestions();
      return;
    }

    const start = cursorPosition - match[2].length - 1;
    setMentionState({
      visible: true,
      query: match[2],
      start,
      end: cursorPosition
    });
  };

  const handleDraftChange = (event) => {
    const value = event.target.value;
    const cursorPosition = event.target.selectionStart;

    setDraftMessage(value);
    updateMentionState(value, cursorPosition);

    clearTimeout(typingTimeoutRef.current);

    if (value.trim()) {
      sendTypingStatus(true);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 2000);
    } else {
      sendTypingStatus(false);
    }
  };

  const memberSuggestions = (group?.members || []).filter((member) => {
    const name = member.userId?.name || '';
    const itNumber = member.itNumber || '';
    const query = mentionState.query.toLowerCase();

    return (
      mentionState.visible &&
      (name.toLowerCase().includes(query) || itNumber.toLowerCase().includes(query))
    );
  });

  const insertMention = (member) => {
    if (mentionState.start < 0 || mentionState.end < 0) return;

    const token = `@${member.itNumber} `;
    const updatedValue = `${draftMessage.slice(0, mentionState.start)}${token}${draftMessage.slice(mentionState.end)}`;
    setDraftMessage(updatedValue);
    closeMentionSuggestions();

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const nextCursorPosition = mentionState.start + token.length;
      textareaRef.current?.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  };

  const postMessage = async (payload) => {
    const response = await fetch(`/api/groups/${groupId}/chat/messages`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send message');
    }

    return data;
  };

  const postFileMessage = async (formData) => {
    const response = await fetch(`/api/groups/${groupId}/chat/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to share file');
    }

    return data;
  };

  const startReply = (message) => {
    setReplyingTo({
      messageId: message._id,
      text: getMessagePreview(message),
      user: message.sender?.name || 'Group member'
    });

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const handleSendMessage = async () => {
    if (!draftMessage.trim()) return;

    try {
      setSending(true);
      setError('');
      await postMessage({
        type: 'text',
        content: draftMessage,
        replyTo: replyingTo ? { messageId: replyingTo.messageId } : undefined
      });
      setDraftMessage('');
      clearReplyTarget();
      closeMentionSuggestions();
      sendTypingStatus(false);
      shouldAutoScrollRef.current = true;
      await fetchChat(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === 'Escape' && mentionState.visible) {
      event.preventDefault();
      closeMentionSuggestions();
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const togglePin = async (messageId) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/chat/messages/${messageId}/pin`, {
        method: 'POST',
        headers: authHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update pin');
      }

      await fetchChat(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const voteOnPoll = async (messageId, optionId) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/chat/messages/${messageId}/poll-vote`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ optionId })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to vote on poll');
      }

      await fetchChat(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const convertToTask = async (messageId) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/chat/messages/${messageId}/convert-to-task`, {
        method: 'POST',
        headers: authHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to convert message to task');
      }

      await fetchChat(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleTask = async (messageId) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/chat/messages/${messageId}/task-toggle`, {
        method: 'POST',
        headers: authHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update task');
      }

      await fetchChat(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const submitPoll = async () => {
    const cleanedOptions = pollState.options.map((option) => option.trim()).filter(Boolean);
    if (!pollState.question.trim() || cleanedOptions.length < 2) {
      setModalError('Add a question and at least two poll options.');
      return;
    }

    try {
      setModalError('');
      await postMessage({
        type: 'poll',
        poll: {
          question: pollState.question,
          options: cleanedOptions
        }
      });
      setPollState(initialPollState);
      setShowPollModal(false);
      shouldAutoScrollRef.current = true;
      await fetchChat(true);
    } catch (err) {
      setModalError(err.message);
    }
  };

  const submitFile = async () => {
    if (!fileState.selectedFile) {
      setModalError('Please choose a file to share.');
      return;
    }

    try {
      setModalError('');
      const formData = new FormData();
      formData.append('type', 'file');
      formData.append('file', fileState.selectedFile);

      if (fileState.name.trim()) {
        formData.append('name', fileState.name.trim());
      }

      if (fileState.note.trim()) {
        formData.append('note', fileState.note.trim());
      }

      if (replyingTo?.messageId) {
        formData.append('replyToMessageId', replyingTo.messageId);
      }

      await postFileMessage(formData);
      resetFileShareState();
      clearReplyTarget();
      setShowFileModal(false);
      shouldAutoScrollRef.current = true;
      await fetchChat(true);
    } catch (err) {
      setModalError(err.message);
    }
  };

  const closeModals = () => {
    setShowPollModal(false);
    setShowFileModal(false);
    setModalError('');
    resetFileShareState();
  };

  const closeEditModal = () => {
    setEditingMessage(null);
    setEditContent('');
    setEditFileState(initialFileEditState);
    setEditPollState(initialPollState);
    setEditTaskState(initialTaskState);
    setEditError('');
    setEditLoading(false);
  };

  const openEditModal = (message) => {
    setEditError('');
    setEditingMessage(message);

    if (message.type === 'text') {
      setEditContent(message.content || '');
    }

    if (message.type === 'file') {
      setEditFileState({
        name: message.file?.name || '',
        url: message.file?.url || '',
        note: message.file?.note || ''
      });
    }

    if (message.type === 'poll') {
      setEditPollState({
        question: message.poll?.question || '',
        options: (message.poll?.options || []).map((option) => option.text)
      });
    }

    if (message.type === 'task') {
      setEditTaskState({
        title: message.task?.title || ''
      });
    }
  };

  const submitMessageEdit = async () => {
    if (!editingMessage) return;

    try {
      setEditLoading(true);
      setEditError('');

      let payload = {};

      if (editingMessage.type === 'text') {
        if (!editContent.trim()) {
          setEditError('Message content is required.');
          setEditLoading(false);
          return;
        }

        payload = { content: editContent };
      }

      if (editingMessage.type === 'file') {
        if (!editFileState.name.trim() || !editFileState.url.trim()) {
          setEditError('File name and URL are required.');
          setEditLoading(false);
          return;
        }

        payload = { file: editFileState };
      }

      if (editingMessage.type === 'poll') {
        const options = editPollState.options.map((option) => option.trim()).filter(Boolean);
        if (!editPollState.question.trim() || options.length < 2) {
          setEditError('Poll question and at least two options are required.');
          setEditLoading(false);
          return;
        }

        payload = {
          poll: {
            question: editPollState.question,
            options
          }
        };
      }

      if (editingMessage.type === 'task') {
        if (!editTaskState.title.trim()) {
          setEditError('Task title is required.');
          setEditLoading(false);
          return;
        }

        payload = {
          task: {
            title: editTaskState.title
          }
        };
      }

      const response = await fetch(`/api/groups/${groupId}/chat/messages/${editingMessage._id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to edit message');
      }

      closeEditModal();
      await fetchChat(true);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete message');
      }

      await fetchChat(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const flashMessageHighlight = (messageId) => {
    clearTimeout(highlightTimeoutRef.current);
    setHighlightedMessageId(messageId);
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedMessageId(null);
    }, 1800);
  };

  const scrollToMessage = (messageId) => {
    const messageNode = messageRefs.current[messageId];
    if (!messageNode) return;

    messageNode.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    requestAnimationFrame(() => {
      messageNode?.focus({ preventScroll: true });
    });

    flashMessageHighlight(messageId);
  };

  const renderReplyReference = (message) => {
    if (!message.replyTo) return null;

    return (
      <GroupChatReplyReference
        senderName={message.replyTo.user}
        preview={message.replyTo.text}
        onClick={() => scrollToMessage(message.replyTo.messageId)}
      />
    );
  };

  const renderMessageBody = (message) => {
    if (message.type === 'poll') {
      return (
        <div className="space-y-3.5">
          {renderReplyReference(message)}
          <p className="text-sm font-semibold text-slate-900">{message.poll?.question}</p>
          <div className="space-y-2.5">
            {(message.poll?.options || []).map((option) => {
              const hasVoted = (option.votes || []).some(
                (vote) => String(vote) === String(currentUserId)
              );

              return (
                <button
                  key={option._id}
                  type="button"
                  onClick={() => voteOnPoll(message._id, option._id)}
                  className={`w-full rounded-xl border px-3.5 py-3 text-left text-sm transition-all duration-200 ${
                    hasVoted
                      ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/70'
                      : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{option.text}</span>
                    <span className="text-xs font-semibold text-slate-400">{option.votes?.length || 0} votes</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (message.type === 'file') {
      return (
        <div className="space-y-3">
          {renderReplyReference(message)}
          <div className="space-y-2">
            <a
              href={message.file?.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-800"
            >
              <Paperclip className="w-4 h-4" />
              {message.file?.name}
            </a>
            {message.file?.note ? (
              <HighlightedContent content={message.file.note} mentions={message.mentions} />
            ) : null}
          </div>
        </div>
      );
    }

    if (message.type === 'task') {
      return (
        <div className="space-y-2.5">
          {renderReplyReference(message)}
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                message.task?.completed
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {message.task?.completed ? 'Completed' : 'Open Task'}
            </span>
            <p className="text-sm font-semibold text-slate-900">{message.task?.title}</p>
          </div>
          {message.task?.sourcePreview ? (
            <p className="text-xs text-slate-500">
              From {message.task.sourceType || 'message'}: {message.task.sourcePreview}
            </p>
          ) : null}
          {message.task?.completedByName ? (
            <p className="text-xs text-slate-500">
              Completed by {message.task.completedByName}
            </p>
          ) : null}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {renderReplyReference(message)}
        <HighlightedContent content={message.content} mentions={message.mentions} />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-slate-500">Loading group chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate('/groups')}
              className="inline-flex items-center gap-2 rounded-xl px-1 text-sm font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Groups
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">{group?.name || 'Group Chat'}</h1>
              <p className="mt-1 text-slate-500">
                {group?.description || 'Chat, share files, and coordinate group work.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <GroupChatToolbarButton
              onClick={() => {
                setModalError('');
                resetFileShareState();
                setShowFileModal(true);
              }}
            >
              <Paperclip className="w-4 h-4" />
              Share File
            </GroupChatToolbarButton>
            <GroupChatToolbarButton
              onClick={() => {
                setModalError('');
                setShowPollModal(true);
              }}
            >
              <Vote className="w-4 h-4" />
              Create Poll
            </GroupChatToolbarButton>
            <GroupChatToolbarButton
              variant="primary"
              onClick={() => {
                setSummaryNotice('AI summaries will plug into this chat once the assistant workflow is connected.');
              }}
            >
              <Sparkles className="w-4 h-4" />
              AI Summary
            </GroupChatToolbarButton>
          </div>
        </div>

        {summaryNotice ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 shadow-sm shadow-blue-100/70" aria-live="polite">
            {summaryNotice}
          </div>
        ) : null}

        {error ? (
          <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-sm shadow-red-100/70" role="alert">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              aria-label="Dismiss error"
              className="rounded-xl text-red-700 hover:text-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              x
            </button>
          </div>
        ) : null}

        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,2fr),360px]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm shadow-slate-200/80">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Message Thread</h2>
                <p className="text-sm text-slate-500">Keep the conversation in one place.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                {messages.length} messages
              </span>
            </div>

            <div
              className="h-[60vh] space-y-4 overflow-y-auto bg-slate-50/80 px-6 py-6"
              aria-label="Group chat messages"
            >
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <p className="font-medium text-slate-500">No messages yet.</p>
                    <p className="mt-1 text-sm text-slate-400">Start the conversation with your group.</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const isCurrentUser = isMessageSender(message);

                  return (
                    <GroupChatMessageCard
                      key={message._id}
                      ref={(node) => {
                        messageRefs.current[message._id] = node;
                      }}
                      senderName={message.sender?.name}
                      senderId={message.sender?.itNumber}
                      timestamp={formatTimestamp(message.createdAt)}
                      isCurrentUser={isCurrentUser}
                      isPinned={message.isPinned}
                      isHighlighted={highlightedMessageId === message._id}
                      canEdit={isMessageSender(message)}
                      canDelete={canDeleteMessage(message)}
                      canConvertToTask={message.type !== 'task'}
                      onReply={() => startReply(message)}
                      onEdit={isMessageSender(message) ? () => openEditModal(message) : undefined}
                      onDelete={canDeleteMessage(message) ? () => deleteMessage(message._id) : undefined}
                      onTogglePin={() => togglePin(message._id)}
                      onConvertToTask={
                        message.type !== 'task' ? () => convertToTask(message._id) : undefined
                      }
                    >
                        {renderMessageBody(message)}
                    </GroupChatMessageCard>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="space-y-4 border-t border-slate-200 bg-white px-6 py-5">
              <div className="flex min-h-[20px] items-center justify-between gap-3 text-sm text-slate-500">
                <span aria-live="polite">{typingText(typingUsers)}</span>
                <span className="text-xs font-medium text-slate-400">@mention by IT number</span>
              </div>

              {replyingTo ? (
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="min-w-0 flex-1">
                    <GroupChatReplyReference
                      senderName={replyingTo.user}
                      preview={replyingTo.text}
                      onClick={() => scrollToMessage(replyingTo.messageId)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={clearReplyTarget}
                    aria-label="Cancel reply"
                    className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}

              <div ref={composerRef} className="relative">
                <textarea
                  ref={textareaRef}
                  value={draftMessage}
                  onChange={handleDraftChange}
                  onKeyDown={handleComposerKeyDown}
                  placeholder="Send a message to your group..."
                  rows="3"
                  aria-label="Message input"
                  aria-describedby="group-chat-composer-help"
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] text-slate-700 shadow-inner shadow-slate-100/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {mentionState.visible && memberSuggestions.length > 0 ? (
                  <div
                    className="absolute bottom-full left-0 right-0 z-10 mb-3 max-h-56 overflow-y-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70"
                    aria-label="Mention suggestions"
                  >
                    {memberSuggestions.slice(0, 6).map((member) => (
                      <button
                        key={member.userId?._id || member.userId}
                        type="button"
                        onClick={() => insertMention(member)}
                        aria-label={`Mention ${member.userId?.name || member.itNumber}`}
                        className="w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:bg-slate-50"
                      >
                        <p className="text-sm font-semibold text-slate-900">{member.userId?.name}</p>
                        <p className="text-xs text-slate-500">{member.itNumber}</p>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span id="group-chat-composer-help">Shift + Enter for a new line</span>
                </div>
                <button
                  type="button"
                  disabled={sending || !draftMessage.trim()}
                  onClick={handleSendMessage}
                  aria-label={sending ? 'Sending message' : 'Send message'}
                  className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200/80 transition-all duration-200 hover:bg-blue-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-5 lg:flex lg:h-full lg:flex-col">
            <GroupChatSidebarSection
              icon={<Pin className="h-4 w-4" />}
              title="Pinned Messages"
            >
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {pinnedMessages.length === 0 ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">No pinned messages yet.</p>
                    <p className="text-xs text-slate-400">Pin important messages to find them quickly.</p>
                  </div>
                ) : (
                  pinnedMessages.map((message) => (
                    <button
                      key={message._id}
                      type="button"
                      onClick={() => scrollToMessage(message._id)}
                      aria-label={`Jump to pinned message from ${message.sender?.name || 'group member'}`}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-left transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      <p className="text-sm font-semibold text-slate-900">{message.sender?.name}</p>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {getMessagePreview(message)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </GroupChatSidebarSection>

            <GroupChatSidebarSection
              icon={<FileText className="h-4 w-4" />}
              title="Shared Files"
            >
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {sharedFiles.length === 0 ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">No files shared yet.</p>
                    <p className="text-xs text-slate-400">Use Share File to add links for your group.</p>
                  </div>
                ) : (
                  sharedFiles.map((message) => (
                    <div key={message._id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                      <a
                        href={message.file?.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
                      >
                        {message.file?.name}
                      </a>
                      <p className="mt-1 text-xs text-slate-500">
                        Shared by {message.sender?.name} on {formatTimestamp(message.createdAt)}
                      </p>
                      {message.file?.note ? (
                        <p className="mt-2 text-xs text-slate-600 line-clamp-2 break-words">{message.file.note}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </GroupChatSidebarSection>

            <GroupChatSidebarSection
              icon={<CheckSquare className="h-4 w-4" />}
              title="Tasks"
            >
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {tasks.length === 0 ? (
                  <p className="text-sm font-medium text-slate-500">Convert a message to create the first task.</p>
                ) : (
                  tasks.map((taskMessage) => (
                    <button
                      key={taskMessage._id}
                      type="button"
                      onClick={() => toggleTask(taskMessage._id)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 text-left transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{taskMessage.task?.title}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {taskMessage.task?.sourcePreview || 'Created from a chat message'}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            taskMessage.task?.completed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {taskMessage.task?.completed ? 'Done' : 'Open'}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </GroupChatSidebarSection>

            <GroupChatSidebarSection
              icon={<Users className="h-4 w-4" />}
              title="Members"
              className="lg:flex-1 lg:min-h-0 lg:flex lg:flex-col"
            >
              <div className="space-y-2 max-h-64 overflow-y-auto lg:flex-1 lg:min-h-0 lg:max-h-none">
                {(group?.members || []).length === 0 ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500">No members to show yet.</p>
                    <p className="text-xs text-slate-400">Group members will appear here once they join.</p>
                  </div>
                ) : (
                  (group?.members || []).map((member) => (
                    <div key={member.userId?._id || member.userId} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                      <p className="text-sm font-semibold text-slate-900">{member.userId?.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{member.itNumber}</p>
                    </div>
                  ))
                )}
              </div>
            </GroupChatSidebarSection>
          </div>
        </div>
      </div>

      <ActionModal
        isOpen={Boolean(editingMessage)}
        title="Edit Message"
        onClose={closeEditModal}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeEditModal}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitMessageEdit}
              disabled={editLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        {editError ? (
          <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{editError}</div>
        ) : null}

        {editingMessage?.type === 'text' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={editContent}
              onChange={(event) => setEditContent(event.target.value)}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        ) : null}

        {editingMessage?.type === 'file' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
              <input
                type="text"
                value={editFileState.name}
                onChange={(event) => setEditFileState({ ...editFileState, name: event.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Link</label>
              <input
                type="text"
                value={editFileState.url}
                onChange={(event) => setEditFileState({ ...editFileState, url: event.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                value={editFileState.note}
                onChange={(event) => setEditFileState({ ...editFileState, note: event.target.value })}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </>
        ) : null}

        {editingMessage?.type === 'poll' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <input
                type="text"
                value={editPollState.question}
                onChange={(event) => setEditPollState({ ...editPollState, question: event.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {editPollState.options.map((option, index) => (
              <input
                key={`edit-poll-option-${index}`}
                type="text"
                value={option}
                onChange={(event) => {
                  const nextOptions = [...editPollState.options];
                  nextOptions[index] = event.target.value;
                  setEditPollState({ ...editPollState, options: nextOptions });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Option ${index + 1}`}
              />
            ))}
            <button
              type="button"
              onClick={() => setEditPollState({ ...editPollState, options: [...editPollState.options, ''] })}
              className="w-full px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 text-sm font-medium"
            >
              Add Option
            </button>
          </div>
        ) : null}

        {editingMessage?.type === 'task' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <input
              type="text"
              value={editTaskState.title}
              onChange={(event) => setEditTaskState({ title: event.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ) : null}
      </ActionModal>

      <ActionModal
        isOpen={showPollModal}
        title="Create Poll"
        onClose={closeModals}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeModals}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitPoll}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Post Poll
            </button>
          </div>
        }
      >
        {modalError ? (
          <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{modalError}</div>
        ) : null}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
          <input
            type="text"
            value={pollState.question}
            onChange={(event) => setPollState({ ...pollState, question: event.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What should the group decide?"
          />
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Options</label>
          {pollState.options.map((option, index) => (
            <input
              key={`option-${index}`}
              type="text"
              value={option}
              onChange={(event) => {
                const nextOptions = [...pollState.options];
                nextOptions[index] = event.target.value;
                setPollState({ ...pollState, options: nextOptions });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Option ${index + 1}`}
            />
          ))}
          <button
            type="button"
            onClick={() => setPollState({ ...pollState, options: [...pollState.options, ''] })}
            className="w-full px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 text-sm font-medium"
          >
            Add Option
          </button>
        </div>
      </ActionModal>

      <ActionModal
        isOpen={showFileModal}
        title="Share File"
        onClose={closeModals}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeModals}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitFile}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Share File
            </button>
          </div>
        }
      >
        {modalError ? (
          <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{modalError}</div>
        ) : null}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleFileDrop}
            onDragOver={handleFileDragOver}
            onDragLeave={handleFileDragLeave}
            className={`w-full rounded-2xl border-2 border-dashed px-4 py-6 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              isFileDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/60'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white p-3 text-blue-600 shadow-sm">
                <Upload className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {fileState.selectedFile ? 'Change selected file' : 'Choose File'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Drag and drop a file here, or click to browse from your computer.
                </p>
                <p className="mt-2 text-xs font-medium text-slate-400">
                  Accepted: PDF, DOCX, PPTX, JPG, PNG
                </p>
                {fileState.selectedFile ? (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {fileState.selectedFile.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatFileSize(fileState.selectedFile.size)}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">File Name (optional)</label>
          <input
            type="text"
            value={fileState.name}
            onChange={(event) => setFileState({ ...fileState, name: event.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={fileState.selectedFile?.name || 'Lecture notes'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
          <textarea
            value={fileState.note}
            onChange={(event) => setFileState({ ...fileState, note: event.target.value })}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Add context for the group..."
          />
        </div>
      </ActionModal>
    </div>
  );
}
