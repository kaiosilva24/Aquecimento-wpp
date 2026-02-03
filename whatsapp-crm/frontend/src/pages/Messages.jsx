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
    const [accounts, setAccounts] = useState([]);
        const [selectedAccountFilter, setSelectedAccountFilter] = useState('all');

        const [formData, setFormData] = useState({
            content: '',
            category: 'casual',
            active: 1,
            accountId: '', // '' for Global
            isBulk: false
        });

        useEffect(() => {
        fetchMessages();
        fetchMessages();
        fetchAccounts();
    }, [selectedAccountFilter]);

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/accounts');
            const data = await res.json();
            setAccounts(data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            try {
                const url = selectedAccountFilter === 'all'
                    ? '/api/messages'
                    : `/api/messages?accountId=${selectedAccountFilter}`;

                const res = await fetch(url);
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
            const openAddModal = () => {
                setEditingMessage(null);
                setFormData({
                    content: '',
                    category: 'casual',
                    active: 1,
                    accountId: '',
                    isBulk: false
                });
                setShowModal(true);
            };
            setShowModal(true);
        };

        const openEditModal = (message) => {
            setEditingMessage(message);
            setFormData({
                content: message.content,
                category: message.category,
                content: message.content,
                category: message.category,
                active: message.active,
                accountId: message.account_id || '',
                isBulk: false
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
                    } else if (formData.isBulk) {
                        // Bulk Import
                        const messages = formData.content.split('\n').filter(line => line.trim() !== '');

                        if (messages.length > 0) {
                            await fetch('/api/messages/batch', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    messages,
                                    category: formData.category,
                                    active: formData.active,
                                    accountId: formData.accountId || null
                                })
                            });
                        }
                    } else {
                        await fetch('/api/messages', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                content: formData.content,
                                category: formData.category,
                                active: formData.active,
                                accountId: formData.accountId || null
                            })
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
                        <div className="page-header flex justify-between items-center">
                            <div>
                                <h1 className="page-title">Mensagens</h1>
                                <p className="page-description">Configure o pool de mensagens para aquecimento</p>
                            </div>
                            <div className="flex gap-md">
                                <select
                                    className="input"
                                    style={{ width: 'auto' }}
                                    value={selectedAccountFilter}
                                    onChange={(e) => setSelectedAccountFilter(e.target.value)}
                                >
                                    <option value="all">Todas as Contas</option>
                                    <option value="global">Apenas Globais</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                                <button onClick={openAddModal} className="btn btn-primary">
                                    <Plus size={20} />
                                    Adicionar Mensagem
                                </button>
                            </div>
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
                                                    <div className="flex items-center gap-sm mb-xs">
                                                        <span className="badge badge-info">{categories[message.category] || message.category}</span>
                                                        {message.account_id ? (
                                                            <span className="badge badge-secondary">
                                                                {accounts.find(a => a.id === message.account_id)?.name || 'Conta Específica'}
                                                            </span>
                                                        ) : (
                                                            <span className="badge badge-secondary">Global</span>
                                                        )}
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
                                                {!editingMessage && (
                                                    <div className="form-group mb-md p-sm border rounded bg-light">
                                                        <label className="flex items-center gap-sm cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.isBulk}
                                                                onChange={(e) => setFormData({ ...formData, isBulk: e.target.checked })}
                                                            />
                                                            <span className="font-bold">Modo em Lote (Bulk Import)</span>
                                                        </label>
                                                        <p className="text-xs text-secondary mt-xs ml-lg">
                                                            Adicione várias mensagens de uma vez, uma por linha.
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="form-group">
                                                    <label className="label">Conta Alvo</label>
                                                    <select
                                                        className="input"
                                                        value={formData.accountId}
                                                        onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                                                    >
                                                        <option value="">Global (Todas as contas)</option>
                                                        {accounts.map(acc => (
                                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                        ))}
                                                    </select>
                                                    <p className="text-xs text-secondary mt-xs">
                                                        Se selecionar uma conta, esta mensagem será usada apenas por ela.
                                                    </p>
                                                </div>

                                                <div className="form-group">
                                                    <label className="label">{formData.isBulk ? 'Mensagens (Uma por linha)' : 'Mensagem'}</label>
                                                    <textarea
                                                        className="input"
                                                        className="input"
                                                        placeholder={formData.isBulk ? "Oi tudo bem?\nOlá como vai?\nEai beleza?" : "Digite a mensagem..."}
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
