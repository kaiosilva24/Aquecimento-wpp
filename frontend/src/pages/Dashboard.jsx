import { useState, useEffect } from 'react';
import { Activity, MessageSquare, Users, TrendingUp, Play, Square } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [recentInteractions, setRecentInteractions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, statusRes, accountsRes, interactionsRes] = await Promise.all([
                fetch('/api/interactions/stats'),
                fetch('/api/interactions/status'),
                fetch('/api/accounts'),
                fetch('/api/interactions/recent?limit=10')
            ]);

            const statsData = await statsRes.json();
            const statusData = await statusRes.json();
            const accountsData = await accountsRes.json();
            const interactionsData = await interactionsRes.json();

            setStats(statsData);
            setIsRunning(statusData.is_running);
            setAccounts(accountsData);
            setRecentInteractions(interactionsData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const toggleWarming = async () => {
        try {
            const endpoint = isRunning ? '/api/interactions/stop' : '/api/interactions/start';
            await fetch(endpoint, { method: 'POST' });
            await fetchData();
        } catch (error) {
            console.error('Error toggling warming:', error);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="animate-spin">
                    <Activity size={32} />
                </div>
            </div>
        );
    }

    const connectedAccounts = accounts.filter(acc => acc.status === 'connected').length;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-description">Visão geral do sistema de aquecimento</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <Users size={24} color="white" />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Contas Conectadas</div>
                        <div className="stat-value">{connectedAccounts}/{accounts.length}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <MessageSquare size={24} color="white" />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Mensagens Hoje</div>
                        <div className="stat-value">{stats?.today_interactions || 0}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <TrendingUp size={24} color="white" />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total de Interações</div>
                        <div className="stat-value">{stats?.total_interactions || 0}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <Activity size={24} color="white" />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Status</div>
                        <div className="stat-value">
                            <span className={`badge ${isRunning ? 'badge-success' : 'badge-warning'}`}>
                                {isRunning ? 'Ativo' : 'Pausado'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Control Panel */}
            <div className="card mb-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="mb-xs">Controle de Aquecimento</h3>
                        <p className="text-secondary">
                            {isRunning
                                ? 'O sistema está enviando mensagens automaticamente'
                                : 'Inicie o aquecimento para começar as interações'}
                        </p>
                    </div>
                    <button
                        onClick={toggleWarming}
                        className={`btn ${isRunning ? 'btn-danger' : 'btn-primary'} btn-lg`}
                        disabled={connectedAccounts < 2}
                    >
                        {isRunning ? (
                            <>
                                <Square size={20} />
                                Parar Aquecimento
                            </>
                        ) : (
                            <>
                                <Play size={20} />
                                Iniciar Aquecimento
                            </>
                        )}
                    </button>
                </div>
                {connectedAccounts < 2 && (
                    <div className="mt-md">
                        <p className="text-warning">
                            ⚠️ Você precisa de pelo menos 2 contas conectadas para iniciar o aquecimento
                        </p>
                    </div>
                )}
            </div>

            {/* Statistics Breakdown */}
            {stats && (
                <div className="card mb-lg">
                    <h3 className="mb-md">Distribuição de Mensagens</h3>
                    <div className="grid grid-3 gap-md">
                        <div>
                            <div className="text-secondary mb-xs">Texto</div>
                            <div className="text-2xl font-bold">{stats.text_count || 0}</div>
                        </div>
                        <div>
                            <div className="text-secondary mb-xs">Imagens</div>
                            <div className="text-2xl font-bold">{stats.image_count || 0}</div>
                        </div>
                        <div>
                            <div className="text-secondary mb-xs">Figurinhas</div>
                            <div className="text-2xl font-bold">{stats.sticker_count || 0}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Interactions */}
            <div className="card">
                <h3 className="mb-md">Interações Recentes</h3>
                {recentInteractions.length === 0 ? (
                    <div className="empty-state">
                        <MessageSquare size={48} className="empty-state-icon" />
                        <p>Nenhuma interação ainda</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>De</th>
                                    <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>Para</th>
                                    <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>Tipo</th>
                                    <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>Mensagem</th>
                                    <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>Horário</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentInteractions.map((interaction) => (
                                    <tr key={interaction.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: 'var(--spacing-sm)' }}>{interaction.from_account_name}</td>
                                        <td style={{ padding: 'var(--spacing-sm)' }}>{interaction.to_account_name}</td>
                                        <td style={{ padding: 'var(--spacing-sm)' }}>
                                            <span className={`badge ${interaction.type === 'text' ? 'badge-info' :
                                                    interaction.type === 'image' ? 'badge-success' :
                                                        'badge-warning'
                                                }`}>
                                                {interaction.type}
                                            </span>
                                        </td>
                                        <td style={{ padding: 'var(--spacing-sm)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {interaction.message_content || '-'}
                                        </td>
                                        <td style={{ padding: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>
                                            {interaction.sent_at ? new Date(interaction.sent_at).toLocaleString('pt-BR') : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
