import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Edit2, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react';

export default function Messages() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMessage, setEditingMessage] = useState(null);
    const [formData, setFormData] = useState({
        content: '',
        category: 'casual',
        active: 1
    });

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const res = await fetch('/api/messages');
            const data = await res.json();
            setMessages(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching messages:', error);
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingMessage(null);
        setFormData({ content: '', category: 'casual', active: 1 });
        setShowModal(true);
    };

    const openEditModal = (message) => {
        setEditingMessage(message);
        setFormData({
            content: message.content,
            category: message.category,
            active: message.active
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.content.trim()) return;

        try {
            if (editingMessage) {
                await fetch(`/api/messages/${editingMessage.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }

            setShowModal(false);
            await fetchMessages();
        } catch (error) {
            console.error('Error saving message:', error);
        }
    };

    const deleteMessage = async (id) => {
        if (!confirm('Tem certeza que deseja remover esta mensagem?')) return;

        try {
            await fetch(`/api/messages/${id}`, { method: 'DELETE' });
            await fetchMessages();
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    };

    const toggleActive = async (message) => {
        try {
            await fetch(`/api/messages/${message.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...message, active: message.active ? 0 : 1 })
            });
            await fetchMessages();
        } catch (error) {
            console.error('Error toggling message:', error);
        }
    };

    if (loading) {
        return <div className="loading"><div className="animate-spin"><MessageSquare size={32} /></div></div>;
    }

    const categories = {
        casual: 'Casual',
        greeting: 'Saudação',
        response: 'Resposta',
        question: 'Pergunta'
    };

    return (
        <div className="page-container">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Mensagens</h1>
                    <p className="page-description">Configure o pool de mensagens para aquecimento</p>
                </div>
                <button onClick={openAddModal} className="btn btn-primary">
                    <Plus size={20} />
                    Adicionar Mensagem
                </button>
            </div>

            <div className="card mb-lg">
                <p className="text-secondary">
                    💡 <strong>Dica:</strong> Use variáveis nas mensagens: <code style={{ background: 'var(--color-bg-input)', padding: '2px 6px', borderRadius: '4px' }}>{'{nome}'}</code>, <code style={{ background: 'var(--color-bg-input)', padding: '2px 6px', borderRadius: '4px' }}>{'{hora}'}</code>, <code style={{ background: 'var(--color-bg-input)', padding: '2px 6px', borderRadius: '4px' }}>{'{data}'}</code>, <code style={{ background: 'var(--color-bg-input)', padding: '2px 6px', borderRadius: '4px' }}>{'{dia}'}</code>
                </p>
            </div>

            {messages.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <MessageSquare size={48} className="empty-state-icon" />
                        <p>Nenhuma mensagem configurada</p>
                        <button onClick={openAddModal} className="btn btn-primary mt-md">
                            <Plus size={20} />
                            Adicionar Primeira Mensagem
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid gap-md">
                    {messages.map((message) => (
                        <div key={message.id} className="card">
                            <div className="flex justify-between items-start gap-md">
                                <div className="flex-1">
                                    <div className="flex items-center gap-sm mb-xs">
                                        <span className="badge badge-info">{categories[message.category] || message.category}</span>
                                        {message.active ? (
                                            <span className="badge badge-success">Ativa</span>
                                        ) : (
                                            <span className="badge badge-warning">Inativa</span>
                                        )}
                                    </div>
                                    <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.content}</p>
                                </div>
                                <div className="flex gap-xs">
                                    <button
                                        onClick={() => toggleActive(message)}
                                        className="btn btn-secondary btn-sm"
                                        title={message.active ? 'Desativar' : 'Ativar'}
                                    >
                                        {message.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                    </button>
                                    <button onClick={() => openEditModal(message)} className="btn btn-secondary btn-sm">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => deleteMessage(message.id)} className="btn btn-danger btn-sm">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingMessage ? 'Editar' : 'Adicionar'} Mensagem</h2>
                            <button onClick={() => setShowModal(false)} className="modal-close">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="label">Mensagem</label>
                                <textarea
                                    className="input"
                                    placeholder="Digite a mensagem..."
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    rows={4}
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Categoria</label>
                                <select
                                    className="input"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {Object.entries(categories).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="flex items-center gap-sm" style={{ cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.active === 1}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked ? 1 : 0 })}
                                    />
                                    <span>Mensagem ativa</span>
                                </label>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingMessage ? 'Salvar' : 'Adicionar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
