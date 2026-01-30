import { useState, useEffect } from 'react';
import { Globe, Save, Shield, Plus, Edit, Trash2, X, Check } from 'lucide-react';

export default function Proxy() {
    const [proxies, setProxies] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProxy, setEditingProxy] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        host: '',
        port: 8080,
        protocol: 'http',
        auth_enabled: false,
        username: '',
        password: '',
        active: true,
        accountIds: []
    });

    useEffect(() => {
        fetchProxies();
        fetchAccounts();
    }, []);

    const fetchProxies = async () => {
        try {
            const res = await fetch('/api/config/proxy');
            const data = await res.json();

            if (Array.isArray(data)) {
                setProxies(data);
            } else {
                console.error('Expected array of proxies but got:', data);
                setProxies([]);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching proxies:', error);
            setProxies([]);
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/accounts');
            const data = await res.json();
            setAccounts(data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const openModal = async (proxy = null) => {
        if (proxy) {
            setEditingProxy(proxy);

            // Fetch assigned accounts for this proxy
            try {
                const res = await fetch(`/api/config/proxy/${proxy.id}/accounts`);
                const assignedAccounts = await res.json();

                setFormData({
                    name: proxy.name || '',
                    host: proxy.host || '',
                    port: proxy.port || 8080,
                    protocol: proxy.protocol || 'http',
                    auth_enabled: !!proxy.auth_enabled,
                    username: proxy.username || '',
                    password: proxy.password || '',
                    active: !!proxy.active,
                    accountIds: assignedAccounts.map(a => a.id)
                });
            } catch (error) {
                console.error('Error fetching proxy accounts:', error);
            }
        } else {
            setEditingProxy(null);
            setFormData({
                name: '',
                host: '',
                port: 8080,
                protocol: 'http',
                auth_enabled: false,
                username: '',
                password: '',
                active: true,
                accountIds: []
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = editingProxy ? `/api/config/proxy/${editingProxy.id}` : '/api/config/proxy';
            const method = editingProxy ? 'PUT' : 'POST';

            // 1. Save Proxy Config
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    host: formData.host,
                    port: formData.port,
                    protocol: formData.protocol,
                    auth_enabled: formData.auth_enabled,
                    username: formData.username,
                    password: formData.password,
                    active: formData.active
                })
            });

            const savedProxy = await res.json();

            // 2. Assign Accounts
            if (savedProxy && savedProxy.id) {
                await fetch(`/api/config/proxy/${savedProxy.id}/accounts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accountIds: formData.accountIds })
                });
            }

            alert('Proxy salvo com sucesso!');
            setShowModal(false);
            fetchProxies();
            fetchAccounts(); // Refresh accounts to update local state if needed
        } catch (error) {
            console.error('Error saving proxy:', error);
            alert('Erro ao salvar proxy');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja remover este proxy?')) return;

        try {
            await fetch(`/api/config/proxy/${id}`, { method: 'DELETE' });
            fetchProxies();
        } catch (error) {
            console.error('Error deleting proxy:', error);
        }
    };

    const testProxy = async (proxy) => {
        const originalText = document.getElementById(`status-${proxy.id}`)?.innerText;
        if (originalText) document.getElementById(`status-${proxy.id}`).innerText = 'Testando...';

        try {
            const res = await fetch('/api/proxies/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proxy)
            });
            const data = await res.json();

            if (data.success) {
                alert(`Conexão BEM SUCEDIDA!\nIP: ${data.ip}`);
            } else {
                alert(`Falha na conexão:\n${data.message || data.error}`);
            }
        } catch (error) {
            console.error('Error testing proxy:', error);
            alert('Erro ao testar proxy: ' + error.message);
        } finally {
            if (originalText) document.getElementById(`status-${proxy.id}`).innerText = originalText;
        }
    };

    const toggleAccountSelection = (accountId) => {
        setFormData(prev => {
            const current = prev.accountIds || [];
            if (current.includes(accountId)) {
                return { ...prev, accountIds: current.filter(id => id !== accountId) };
            } else {
                return { ...prev, accountIds: [...current, accountId] };
            }
        });
    };

    if (loading) {
        return <div className="loading"><div className="animate-spin"><Globe size={32} /></div></div>;
    }

    return (
        <div className="page-container">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Configuração de Proxies</h1>
                    <p className="page-description">Gerencie seus proxies e atribua contas</p>
                </div>
                <button onClick={() => openModal()} className="btn btn-primary">
                    <Plus size={20} />
                    Adicionar Proxy
                </button>
            </div>

            <div className="grid grid-2 gap-lg">
                {proxies.map(proxy => (
                    <div key={proxy.id} className="card">
                        <div className="flex justify-between items-start mb-md">
                            <div className="flex items-center gap-sm">
                                <Shield size={24} className="text-primary" />
                                <div>
                                    <h3 className="font-bold">{proxy.name}</h3>
                                    <p className="text-secondary text-sm">
                                        {proxy.protocol}://{proxy.host}:{proxy.port}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-xs">
                                <button onClick={() => testProxy(proxy)} className="btn btn-secondary btn-sm" title="Testar Conexão">
                                    <Globe size={16} />
                                </button>
                                <button onClick={() => openModal(proxy)} className="btn btn-secondary btn-sm" title="Editar">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(proxy.id)} className="btn btn-danger btn-sm" title="Excluir">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="badges mb-md">
                            <span className={`badge ${proxy.active ? 'badge-success' : 'badge-warning'}`}>
                                {proxy.active ? 'Ativo' : 'Inativo'}
                            </span>
                            {proxy.auth_enabled && (
                                <span className="badge badge-secondary">Autenticado</span>
                            )}
                        </div>

                        {/* Can show count of assigned accounts here if we fetch it, or leave simple */}
                    </div>
                ))}

                {proxies.length === 0 && (
                    <div className="text-center text-secondary col-span-2 py-xl">
                        Nenhum proxy configurado. Adicione um para começar.
                    </div>
                )}
            </div>

            {/* Modal */}
            {
                showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                            <div className="modal-header">
                                <h2 className="modal-title">{editingProxy ? 'Editar Proxy' : 'Novo Proxy'}</h2>
                                <button onClick={() => setShowModal(false)} className="modal-close">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="modal-body">
                                {/* Proxy Settings */}
                                <div className="form-group">
                                    <label className="label">Nome de Identificação</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Ex: Proxy 4G Vivo"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group" style={{ flex: 2 }}>
                                        <label className="label">Host (IP/Domínio)</label>
                                        <input
                                            type="text"
                                            className="input"
                                            value={formData.host}
                                            onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="label">Porta</label>
                                        <input
                                            type="number"
                                            className="input"
                                            value={formData.port}
                                            onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="label">Protocolo</label>
                                    <select
                                        className="input"
                                        value={formData.protocol}
                                        onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                                    >
                                        <option value="http">HTTP</option>
                                        <option value="https">HTTPS</option>
                                        <option value="socks4">SOCKS4</option>
                                        <option value="socks5">SOCKS5</option>
                                    </select>
                                </div>

                                <div className="form-group mt-md">
                                    <label className="flex items-center gap-sm" style={{ cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.auth_enabled}
                                            onChange={(e) => setFormData({ ...formData, auth_enabled: e.target.checked })}
                                        />
                                        <span>Requer Autenticação</span>
                                    </label>
                                </div>

                                {formData.auth_enabled && (
                                    <div className="form-row animate-fadeIn">
                                        <div className="form-group">
                                            <label className="label">Usuário</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="label">Senha</label>
                                            <input
                                                type="password"
                                                className="input"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Account Selection */}
                                <div className="mt-lg pt-md border-t">
                                    <h3 className="text-md font-bold mb-sm">Atribuir Contas</h3>
                                    <p className="text-sm text-secondary mb-md">Selecione as contas que utilizarão este proxy.</p>

                                    <div className="account-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {accounts.length === 0 ? (
                                            <p className="text-sm text-secondary">Nenhuma conta cadastrada.</p>
                                        ) : (
                                            accounts.map(account => (
                                                <label key={account.id} className="flex items-center gap-sm p-xs hover:bg-glass rounded cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.accountIds.includes(account.id)}
                                                        onChange={() => toggleAccountSelection(account.id)}
                                                    />
                                                    <span className={formData.accountIds.includes(account.id) ? 'font-bold' : ''}>
                                                        {account.name}
                                                    </span>
                                                    {account.proxy_id && account.proxy_id !== (editingProxy?.id) && !formData.accountIds.includes(account.id) && (
                                                        <span className="text-xs text-warning ml-auto">
                                                            (Já em outro proxy)
                                                        </span>
                                                    )}
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="modal-footer mt-lg">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? 'Salvando...' : 'Salvar Proxy'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
