import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, QrCode, RefreshCw, Wifi, WifiOff, X, Globe, Server, Activity } from 'lucide-react';

export default function Accounts() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [accountNetworkInfo, setAccountNetworkInfo] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountNetworkMode, setNewAccountNetworkMode] = useState('local');
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [qrCode, setQrCode] = useState('');
    const [qrNetworkInfo, setQrNetworkInfo] = useState(null);

    useEffect(() => {
        fetchAccounts();
        const interval = setInterval(() => {
            fetchAccounts();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Fetch network info for connected accounts whenever accounts list updates
    useEffect(() => {
        accounts.forEach(account => {
            if (account.status === 'connected' && !accountNetworkInfo[account.id]) {
                fetchAccountNetwork(account.id);
            }
        });
    }, [accounts]);

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/accounts');
            const data = await res.json();
            setAccounts(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            setLoading(false);
        }
    };

    const fetchAccountNetwork = async (accountId) => {
        try {
            // Set loading state for this account locally if needed, or just update when data arrives
            const res = await fetch(`/api/accounts/${accountId}/network`);
            const data = await res.json();

            setAccountNetworkInfo(prev => ({
                ...prev,
                [accountId]: data
            }));
        } catch (error) {
            console.error(`Error fetching network for account ${accountId}:`, error);
        }
    };

    const addAccount = async (e) => {
        e.preventDefault();
        if (!newAccountName.trim()) return;

        try {
            const res = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newAccountName,
                    networkMode: newAccountNetworkMode
                })
            });

            const data = await res.json();
            setNewAccountName('');
            setNewAccountNetworkMode('local');
            setShowAddModal(false);
            await fetchAccounts();

            // Show QR code
            setSelectedAccount(data);
            fetchQRCode(data.id);
        } catch (error) {
            console.error('Error adding account:', error);
        }
    };

    const fetchQRCode = async (accountId) => {
        setShowQRModal(true);
        setQrCode('');
        setQrNetworkInfo(null);

        // Fetch network info immediately
        try {
            console.log(`Fetching network info for account ${accountId}...`);
            const netRes = await fetch(`/api/accounts/${accountId}/network`);
            const netData = await netRes.json();
            console.log('Network info received:', netData);
            setQrNetworkInfo(netData);
        } catch (error) {
            console.error('Error fetching QR network info:', error);
        }

        const checkQR = async () => {
            try {
                const res = await fetch(`/api/accounts/${accountId}/qr`);
                if (res.ok) {
                    const data = await res.json();
                    setQrCode(data.qr_code);
                }
            } catch (error) {
                console.error('Error fetching QR code:', error);
            }
        };

        checkQR();
        const interval = setInterval(checkQR, 2000);

        setTimeout(() => clearInterval(interval), 60000); // Stop after 1 minute
    };

    const deleteAccount = async (id) => {
        if (!confirm('Tem certeza que deseja remover esta conta?')) return;

        try {
            await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
            await fetchAccounts();
        } catch (error) {
            console.error('Error deleting account:', error);
        }
    };

    const reconnect = async (id) => {
        try {
            await fetch(`/api/accounts/${id}/reconnect`, { method: 'POST' });
            const account = accounts.find(a => a.id === id);
            setSelectedAccount(account);
            fetchQRCode(id);
        } catch (error) {
            console.error('Error reconnecting:', error);
        }
    };

    const updateNetworkMode = async (accountId, networkMode) => {
        try {
            await fetch(`/api/accounts/${accountId}/network-mode`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ networkMode })
            });
            await fetchAccounts();
            // Refetch network info after mode change if connected
            fetchAccountNetwork(accountId);
        } catch (error) {
            console.error('Error updating network mode:', error);
        }
    };

    if (loading) {
        return <div className="loading"><div className="animate-spin"><Users size={32} /></div></div>;
    }

    return (
        <div className="page-container">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Contas WhatsApp</h1>
                    <p className="page-description">Gerencie suas contas de aquecimento</p>
                </div>
                <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                    <Plus size={20} />
                    Adicionar Conta
                </button>
            </div>

            {accounts.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <Users size={48} className="empty-state-icon" />
                        <p>Nenhuma conta adicionada ainda</p>
                        <button onClick={() => setShowAddModal(true)} className="btn btn-primary mt-md">
                            <Plus size={20} />
                            Adicionar Primeira Conta
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-2 gap-lg">
                    {accounts.map((account) => {
                        const netInfo = accountNetworkInfo[account.id];
                        return (
                            <div key={account.id} className="card">
                                <div className="flex justify-between items-start mb-md">
                                    <div>
                                        <h3 className="mb-xs">{account.name}</h3>
                                        {account.phone && (
                                            <p className="text-secondary text-sm">+{account.phone}</p>
                                        )}
                                    </div>
                                    <span className={`badge ${account.status === 'connected' ? 'badge-success' : 'badge-warning'}`}>
                                        {account.status === 'connected' ? (
                                            <><Wifi size={12} /> Conectado</>
                                        ) : (
                                            <><WifiOff size={12} /> Desconectado</>
                                        )}
                                    </span>
                                </div>

                                {/* Network Mode Selector */}
                                <div className="card-glass mb-md p-sm">
                                    <label className="text-sm text-secondary mb-xs block">Modo de Rede:</label>
                                    <div className="flex gap-sm">
                                        <button
                                            onClick={() => updateNetworkMode(account.id, 'local')}
                                            className={`btn btn-sm flex-1 ${account.network_mode === 'local' ? 'btn-primary' : 'btn-secondary'}`}
                                            title="Usar rede local do servidor"
                                        >
                                            <Server size={14} />
                                            Local
                                        </button>
                                        <button
                                            onClick={() => updateNetworkMode(account.id, 'proxy')}
                                            className={`btn btn-sm flex-1 ${account.network_mode === 'proxy' ? 'btn-primary' : 'btn-secondary'}`}
                                            title="Usar proxy do datacenter"
                                        >
                                            <Globe size={14} />
                                            Proxy
                                        </button>
                                    </div>
                                </div>

                                {/* Network Info Display */}
                                {account.status === 'connected' && (
                                    <div className="card-glass mb-md p-sm">
                                        <div className="flex justify-between items-center mb-xs">
                                            <label className="text-sm text-secondary">Rede Conectada:</label>
                                            <button
                                                onClick={() => fetchAccountNetwork(account.id)}
                                                className="btn-icon text-secondary hover:text-primary"
                                                title="Atualizar Info de Rede"
                                            >
                                                <Activity size={12} />
                                            </button>
                                        </div>

                                        {netInfo ? (
                                            netInfo.success ? (
                                                <>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <div className="flex items-center gap-xs">
                                                            <span className="text-secondary">IP:</span>
                                                            <span className="font-bold">{netInfo.ip}</span>
                                                        </div>
                                                        {netInfo.country && <span className="text-xs badge badge-secondary">{netInfo.country}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-xs text-sm mt-xs">
                                                        <span className="text-secondary">ISP:</span>
                                                        <span className="truncate">{netInfo.isp}</span>
                                                    </div>
                                                    {netInfo.proxy_name && (
                                                        <div className="flex items-center gap-xs text-xs mt-xs text-secondary">
                                                            <span>via {netInfo.proxy_name}</span>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-sm text-danger">Erro ao verificar rede: {netInfo.error}</div>
                                            )
                                        ) : (
                                            <div className="text-sm text-secondary italic">Verificando...</div>
                                        )}
                                    </div>
                                )}


                                <div className="flex gap-sm">
                                    {account.status !== 'connected' && (
                                        <button onClick={() => reconnect(account.id)} className="btn btn-secondary btn-sm">
                                            <QrCode size={16} />
                                            Conectar
                                        </button>
                                    )}
                                    <button onClick={() => reconnect(account.id)} className="btn btn-secondary btn-sm">
                                        <RefreshCw size={16} />
                                        Reconectar
                                    </button>
                                    <button onClick={() => deleteAccount(account.id)} className="btn btn-danger btn-sm">
                                        <Trash2 size={16} />
                                        Remover
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Account Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Adicionar Conta</h2>
                            <button onClick={() => setShowAddModal(false)} className="modal-close">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={addAccount}>
                            <div className="form-group">
                                <label className="label">Nome da Conta</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Ex: Conta Principal"
                                    value={newAccountName}
                                    onChange={(e) => setNewAccountName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Modo de Rede</label>
                                <div className="flex gap-sm">
                                    <button
                                        type="button"
                                        onClick={() => setNewAccountNetworkMode('local')}
                                        className={`btn flex-1 ${newAccountNetworkMode === 'local' ? 'btn-primary' : 'btn-secondary'}`}
                                    >
                                        <Server size={16} />
                                        Local
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewAccountNetworkMode('proxy')}
                                        className={`btn flex-1 ${newAccountNetworkMode === 'proxy' ? 'btn-primary' : 'btn-secondary'}`}
                                    >
                                        <Globe size={16} />
                                        Proxy
                                    </button>
                                </div>
                                <p className="text-sm text-secondary mt-xs">
                                    {newAccountNetworkMode === 'local'
                                        ? '🔹 Usa a rede local do servidor (recomendado para testes)'
                                        : '🌐 Usa o proxy do datacenter (para produção)'}
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Adicionar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Code Modal */}
            {showQRModal && (
                <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Escanear QR Code [v2]</h2>
                            <button onClick={() => setShowQRModal(false)} className="modal-close">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Network Info Banner in Modal */}
                        {qrNetworkInfo && (
                            <div
                                className="mb-md p-sm border rounded"
                                style={{
                                    backgroundColor: qrNetworkInfo.success ? 'rgba(72, 187, 120, 0.1)' : 'rgba(252, 129, 129, 0.1)',
                                    borderColor: qrNetworkInfo.success ? 'var(--color-success)' : 'var(--color-error)'
                                }}
                            >
                                {qrNetworkInfo.success ? (
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-success mb-xs">
                                            <Wifi size={14} className="inline mr-xs" />
                                            Rede Conectada
                                        </p>
                                        <p className="text-lg font-mono mb-xs">{qrNetworkInfo.ip}</p>
                                        <div className="flex justify-center items-center gap-xs text-sm text-secondary">
                                            <span>{qrNetworkInfo.isp}</span>
                                            {qrNetworkInfo.country && <span className="badge badge-secondary" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>{qrNetworkInfo.country}</span>}
                                        </div>
                                        {qrNetworkInfo.proxy_name && (
                                            <p className="text-xs text-secondary mt-xs flex items-center justify-center gap-xs">
                                                <Globe size={10} />
                                                via {qrNetworkInfo.proxy_name}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center text-error text-sm">
                                        <WifiOff size={14} className="inline mr-xs" />
                                        Falha na verificação de rede: {qrNetworkInfo.error}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="text-center">
                            {qrCode ? (
                                <>
                                    <div className="p-sm bg-white inline-block rounded-md">
                                        <img src={qrCode} alt="QR Code" style={{ maxWidth: '250px', display: 'block' }} />
                                    </div>
                                    <p className="text-secondary mt-md">Escaneie este QR code com o WhatsApp</p>
                                </>
                            ) : (
                                <div className="py-xl">
                                    <div className="animate-pulse">
                                        <QrCode size={64} className="mx-auto text-muted" />
                                    </div>
                                    <p className="text-secondary mt-md">Aguardando QR code...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
