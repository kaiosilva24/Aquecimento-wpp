import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Clock, MessageCircle, Save } from 'lucide-react';

export default function Configuration() {
    const [delayConfig, setDelayConfig] = useState(null);
    const [autoReplyConfig, setAutoReplyConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const [delayRes, autoReplyRes] = await Promise.all([
                fetch('/api/config/delay'),
                fetch('/api/config/auto-reply')
            ]);

            const delayData = await delayRes.json();
            const autoReplyData = await autoReplyRes.json();

            setDelayConfig(delayData);
            setAutoReplyConfig(autoReplyData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching configs:', error);
            setLoading(false);
        }
    };

    const saveDelayConfig = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await fetch('/api/config/delay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(delayConfig)
            });
            alert('Configuração de delay salva com sucesso!');
        } catch (error) {
            console.error('Error saving delay config:', error);
            alert('Erro ao salvar configuração');
        } finally {
            setSaving(false);
        }
    };

    const saveAutoReplyConfig = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await fetch('/api/config/auto-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(autoReplyConfig)
            });
            alert('Configuração de auto-resposta salva com sucesso!');
        } catch (error) {
            console.error('Error saving auto-reply config:', error);
            alert('Erro ao salvar configuração');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading"><div className="animate-spin"><SettingsIcon size={32} /></div></div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Configurações</h1>
                <p className="page-description">Configure delays e auto-respostas</p>
            </div>

            {/* Delay Configuration */}
            <div className="card mb-lg">
                <h3 className="mb-md flex items-center gap-sm">
                    <Clock size={20} />
                    Configuração de Delays
                </h3>
                <p className="text-secondary mb-lg">
                    Configure o tempo de espera entre envios de mensagens
                </p>

                <form onSubmit={saveDelayConfig}>
                    <div className="form-group">
                        <label className="label">Tipo de Delay</label>
                        <select
                            className="input"
                            value={delayConfig?.type || 'random'}
                            onChange={(e) => setDelayConfig({ ...delayConfig, type: e.target.value })}
                        >
                            <option value="fixed">Fixo - Tempo exato entre mensagens</option>
                            <option value="random">Aleatório - Range min-max</option>
                            <option value="human">Humano - Simula comportamento natural</option>
                            <option value="progressive">Progressivo - Aumenta gradualmente</option>
                        </select>
                    </div>

                    {delayConfig?.type === 'fixed' && (
                        <div className="form-group">
                            <label className="label">Tempo Fixo (segundos)</label>
                            <input
                                type="number"
                                className="input"
                                min="10"
                                value={delayConfig?.fixed_seconds || 60}
                                onChange={(e) => setDelayConfig({ ...delayConfig, fixed_seconds: parseInt(e.target.value) })}
                            />
                        </div>
                    )}

                    {(delayConfig?.type === 'random' || delayConfig?.type === 'progressive') && (
                        <div className="form-row">
                            <div className="form-group">
                                <label className="label">Mínimo (segundos)</label>
                                <input
                                    type="number"
                                    className="input"
                                    min="10"
                                    value={delayConfig?.min_seconds || 30}
                                    onChange={(e) => setDelayConfig({ ...delayConfig, min_seconds: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Máximo (segundos)</label>
                                <input
                                    type="number"
                                    className="input"
                                    min="10"
                                    value={delayConfig?.max_seconds || 120}
                                    onChange={(e) => setDelayConfig({ ...delayConfig, max_seconds: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                    )}

                    {delayConfig?.description && (
                        <div className="card-glass mt-md" style={{ padding: 'var(--spacing-md)' }}>
                            <p className="text-sm text-secondary">
                                <strong>Configuração atual:</strong> {delayConfig.description}
                            </p>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary mt-lg" disabled={saving}>
                        <Save size={20} />
                        {saving ? 'Salvando...' : 'Salvar Delay'}
                    </button>
                </form>
            </div>

            {/* Auto-Reply Configuration */}
            <div className="card">
                <h3 className="mb-md flex items-center gap-sm">
                    <MessageCircle size={20} />
                    Configuração de Auto-Resposta
                </h3>
                <p className="text-secondary mb-lg">
                    Configure como o sistema responde mensagens recebidas
                </p>

                <form onSubmit={saveAutoReplyConfig}>
                    <div className="form-group">
                        <label className="flex items-center gap-sm" style={{ cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={autoReplyConfig?.enabled_individual === 1}
                                onChange={(e) => setAutoReplyConfig({ ...autoReplyConfig, enabled_individual: e.target.checked ? 1 : 0 })}
                            />
                            <span>Responder contatos individuais automaticamente</span>
                        </label>
                    </div>

                    <div className="form-group">
                        <label className="flex items-center gap-sm" style={{ cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={autoReplyConfig?.enabled_groups === 1}
                                onChange={(e) => setAutoReplyConfig({ ...autoReplyConfig, enabled_groups: e.target.checked ? 1 : 0 })}
                            />
                            <span>Responder grupos automaticamente</span>
                        </label>
                    </div>

                    <div className="form-group">
                        <label className="label">Delay antes de responder (segundos)</label>
                        <input
                            type="number"
                            className="input"
                            min="1"
                            max="60"
                            value={autoReplyConfig?.delay_before_reply || 5}
                            onChange={(e) => setAutoReplyConfig({ ...autoReplyConfig, delay_before_reply: parseInt(e.target.value) })}
                        />
                        <p className="text-sm text-secondary mt-xs">
                            Tempo de espera antes de enviar a resposta automática (simula digitação)
                        </p>
                    </div>

                    <div className="form-group">
                        <label className="label">Lista de Ignorar (opcional)</label>
                        <textarea
                            className="input"
                            placeholder="Digite números para ignorar, separados por vírgula&#10;Ex: 5511999999999, 5511888888888"
                            rows={3}
                            value={autoReplyConfig?.ignore_list || ''}
                            onChange={(e) => setAutoReplyConfig({ ...autoReplyConfig, ignore_list: e.target.value })}
                        />
                        <p className="text-sm text-secondary mt-xs">
                            Números que não receberão respostas automáticas
                        </p>
                    </div>

                    <button type="submit" className="btn btn-primary mt-lg" disabled={saving}>
                        <Save size={20} />
                        {saving ? 'Salvando...' : 'Salvar Auto-Resposta'}
                    </button>
                </form>
            </div>
        </div>
    );
}
