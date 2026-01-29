import React, { useState, useEffect } from 'react';
import {
    Shield,
    Smartphone,
    Plus,
    Trash2,
    RefreshCw,
    Download,
    CheckCircle,
    XCircle,
    Power,
    Activity,
    QrCode,
    TerminalSquare,
    AlertTriangle
} from 'lucide-react';

export default function VPN() {
    const [status, setStatus] = useState({ running: false });
    const [peers, setPeers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Add Peer Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTermuxModal, setShowTermuxModal] = useState(false);
    const [newPeerName, setNewPeerName] = useState('');
    const [newPeerResult, setNewPeerResult] = useState(null);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll status
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [statusRes, peersRes] = await Promise.all([
                fetch('/api/vpn/status'),
                fetch('/api/vpn/peers')
            ]);

            if (statusRes.ok) setStatus(await statusRes.json());
            if (peersRes.ok) setPeers(await peersRes.json());
        } catch (error) {
            console.error('Error fetching VPN data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartStop = async () => {
        setActionLoading(true);
        try {
            const endpoint = status.running ? '/api/vpn/stop' : '/api/vpn/start';
            const res = await fetch(endpoint, { method: 'POST' });
            if (res.ok) {
                await fetchData();
            }
        } catch (error) {
            console.error('Action error:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddPeer = async () => {
        if (!newPeerName) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/vpn/peers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newPeerName })
            });
            const data = await res.json();
            if (data.success) {
                setNewPeerResult(data);
                fetchData();
            }
        } catch (error) {
            console.error('Add peer error:', error);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-xl max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-xl">
                <div>
                    <h1 className="text-3xl font-bold mb-xs flex items-center gap-sm">
                        <Shield className="text-primary" size={32} />
                        VPN & Conexão Segura
                    </h1>
                    <p className="text-secondary">
                        Configure seu próprio servidor VPN para conectar dispositivos móveis de forma segura.
                    </p>
                </div>

                <div className={`flex items-center gap-md px-lg py-sm rounded-lg border ${status.running ? 'bg-success-subtle border-success' : 'bg-bg-card border-border'}`}>
                    <div className="flex items-center gap-sm">
                        <div className={`w-3 h-3 rounded-full ${status.running ? 'bg-success animate-pulse' : 'bg-error'}`} />
                        <span className="font-mono font-bold">
                            {status.running ? 'VPN ONLINE' : 'VPN OFFLINE'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Control Card */}
            <div className="card mb-xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-lg">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold mb-sm">Servidor WireGuard</h3>
                        <p className="text-secondary mb-md">
                            O servidor VPN permite que você conecte celulares e outros dispositivos à rede deste servidor.
                            Isso é essencial para que o WhatsApp no celular consiga usar a mesma conexão (IP) que o sistema.
                        </p>
                        <div className="flex gap-md text-sm text-secondary">
                            <div className="flex items-center gap-xs">
                                <Activity size={16} />
                                IP Interno: 10.0.0.1
                            </div>
                            <div className="flex items-center gap-xs">
                                <RefreshCw size={16} />
                                Porta: 51820 (UDP)
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleStartStop}
                        disabled={actionLoading}
                        className={`btn ${status.running ? 'btn-danger' : 'btn-primary'} btn-lg min-w-[200px]`}
                    >
                        {actionLoading ? (
                            <RefreshCw className="animate-spin" />
                        ) : (
                            <Power className="mr-sm" />
                        )}
                        {status.running ? 'Desligar VPN' : 'Ligar VPN'}
                    </button>
                </div>
            </div>

            {/* Peers Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
                {/* Device List */}
                <div className="lg:col-span-2 space-y-md">
                    <div className="flex justify-between items-center mb-md">
                        <h3 className="text-xl font-bold flex items-center gap-sm">
                            <Smartphone size={24} />
                            Dispositivos Conectados
                        </h3>
                        <button
                            onClick={() => { setShowAddModal(true); setNewPeerResult(null); setNewPeerName(''); }}
                            className="btn btn-secondary flex items-center gap-xs"
                            disabled={!status.running}
                        >
                            <Plus size={18} />
                            Adicionar Dispositivo
                        </button>
                    </div>

                    {!status.running && (
                        <div className="p-lg border border-warning bg-warning-subtle rounded-lg text-warning text-center">
                            Ligue a VPN para gerenciar dispositivos.
                        </div>
                    )}

                    {status.running && peers.length === 0 && (
                        <div className="text-center py-xl text-secondary border border-dashed rounded-lg">
                            <Smartphone size={48} className="mx-auto mb-md opacity-20" />
                            <p>Nenhum dispositivo conectado.</p>
                            <p className="text-sm">Adicione seu celular para começar.</p>
                        </div>
                    )}

                    {peers.map((peer, idx) => (
                        <div key={idx} className="card p-md flex items-center justify-between hover:border-primary transition-colors">
                            <div className="flex items-center gap-md">
                                <div className="p-sm bg-bg-dark rounded-full">
                                    <Smartphone size={24} className="text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-bold">Dispositivo {idx + 1}</h4>
                                    <div className="flex gap-md text-xs text-secondary mt-xs font-mono">
                                        <span>IP: {peer.allowedIps.split('/')[0]}</span>
                                        <span>
                                            {peer.handshake > 0
                                                ? `Último acesso: ${new Date(peer.handshake * 1000).toLocaleString()}`
                                                : 'Nunca acessou'}
                                        </span>
                                    </div>
                                    <div className="flex gap-xs mt-xs text-xs">
                                        <span className="flex items-center gap-xs text-secondary">
                                            <Download size={10} /> {Math.round(peer.rx / 1024)} KB
                                        </span>
                                        <span className="flex items-center gap-xs text-secondary">
                                            <RefreshCw size={10} /> {Math.round(peer.tx / 1024)} KB
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions (Delete not implemented fully in backend route yet for specific ID, so visual only for now) */}
                            {/* <button className="btn-icon text-error hover:bg-error-subtle p-sm rounded">
                                <Trash2 size={18} />
                            </button> */}
                        </div>
                    ))}
                </div>

                {/* Instructions / Sidebar */}
                <div className="space-y-md">
                    <div className="card p-lg">
                        <h3 className="font-bold mb-md">Como conectar?</h3>
                        <ol className="space-y-md text-sm text-secondary list-decimal pl-md">
                            <li>
                                <span className="text-white font-bold">Instale o App WireGuard:</span>
                                <div className="flex gap-sm mt-xs">
                                    <a href="#" className="text-primary hover:underline">Android</a>
                                    <span className="text-muted">|</span>
                                    <a href="#" className="text-primary hover:underline">iOS</a>
                                </div>
                            </li>
                            <li>
                                Clique em <span className="text-white font-bold">"Adicionar Dispositivo"</span> nesta tela.
                            </li>
                            <li>
                                <span className="text-white font-bold">Escaneie o QR Code</span> gerado com o aplicativo WireGuard.
                            </li>
                            <li>
                                Ative a chave no aplicativo para conectar.
                            </li>
                        </ol>

                        <div className="mt-xl pt-md border-t border-border">
                            <h3 className="font-bold mb-sm flex items-center gap-sm">
                                <TerminalSquare size={20} />
                                Android como Proxy (Termux)
                            </h3>
                            <p className="text-secondary text-sm mb-md">
                                Transforme seu celular em um Proxy residencial usando o Termux.
                            </p>
                            <button
                                onClick={() => setShowTermuxModal(true)}
                                className="btn btn-secondary w-full text-sm"
                            >
                                Ver Guia Completo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Termux Guide Modal */}
            {showTermuxModal && (
                <div className="modal-overlay" onClick={() => setShowTermuxModal(false)}>
                    <div className="modal max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title flex items-center gap-sm">
                                <TerminalSquare className="text-primary" />
                                Guia: Android + Termux + TinyProxy
                            </h2>
                            <button onClick={() => setShowTermuxModal(false)} className="modal-close"><XCircle size={24} /></button>
                        </div>

                        <div className="space-y-lg max-h-[70vh] overflow-y-auto pr-sm">
                            <div className="p-md bg-warning-subtle border border-warning rounded-lg">
                                <h4 className="font-bold text-warning mb-xs flex items-center gap-xs">
                                    <AlertTriangle size={18} />
                                    Atenção: Android Antigo (7/8)
                                </h4>
                                <p className="text-sm text-warning-content">
                                    A versão da Play Store não funciona mais. Para Android 7 ou 8 (Samsung S7),
                                    você deve baixar o Termux pelo <strong>F-Droid</strong>.
                                </p>
                                <a
                                    href="https://f-droid.org/repo/com.termux_118.apk"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary underline text-sm mt-xs block font-bold"
                                >
                                    Baixar APK (Versão compatível F-Droid)
                                </a>
                            </div>

                            <div className="space-y-md">
                                <h3 className="font-bold text-lg">Passo 1: Conectar na VPN</h3>
                                <p className="text-secondary">Antes de tudo, garanta que seu celular já está conectado nesta VPN pelo app WireGuard.</p>
                            </div>

                            <div className="space-y-md">
                                <h3 className="font-bold text-lg">Passo 2: Instalar o TinyProxy</h3>
                                <p className="text-secondary">Abra o Termux e digite os comandos abaixo, um por um:</p>
                                <pre className="bg-bg-dark p-md rounded-lg font-mono text-sm overflow-x-auto select-all">
                                    {`pkg update -y && pkg upgrade -y
pkg install tinyproxy -y`}
                                </pre>
                            </div>

                            <div className="space-y-md">
                                <h3 className="font-bold text-lg">Passo 3: Configurar</h3>
                                <p className="text-secondary">Vamos editar o arquivo de configuração para aceitar conexões da VPN (10.0.0.x).</p>
                                <p className="text-sm text-secondary mb-xs">Copie e cole este comando inteiro no Termux:</p>
                                <pre className="bg-bg-dark p-md rounded-lg font-mono text-sm overflow-x-auto select-all">
                                    {`echo "Port 8888
Listen 0.0.0.0
Timeout 600
Allow 127.0.0.1
Allow 10.0.0.0/8
MaxClients 100" > $PREFIX/etc/tinyproxy/tinyproxy.conf`}
                                </pre>
                            </div>

                            <div className="space-y-md">
                                <h3 className="font-bold text-lg">Passo 4: Rodar o Proxy</h3>
                                <p className="text-secondary">Inicie o proxy com o comando:</p>
                                <pre className="bg-bg-dark p-md rounded-lg font-mono text-sm overflow-x-auto select-all">
                                    tinyproxy -d
                                </pre>
                                <p className="text-xs text-muted mt-xs">O "-d" faz rodar em primeiro plano para você ver se há erros.</p>
                            </div>

                            <div className="space-y-md">
                                <h3 className="font-bold text-lg">Passo 5: Adicionar no Sistema</h3>
                                <p className="text-secondary">
                                    Agora vá na aba <strong>Proxy</strong> aqui no sistema e adicione:
                                </p>
                                <ul className="list-disc list-inside text-sm text-secondary ml-md">
                                    <li><strong>Host:</strong> O IP do celular na VPN (ex: 10.0.0.3)</li>
                                    <li><strong>Porta:</strong> 8888</li>
                                </ul>
                            </div>
                        </div>

                        <div className="modal-footer mt-lg pt-md border-t border-border flex justify-end">
                            <button onClick={() => setShowTermuxModal(false)} className="btn btn-primary">
                                Entendi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Peer Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Novo Dispositivo</h2>
                            <button onClick={() => setShowAddModal(false)} className="modal-close"><XCircle size={24} /></button>
                        </div>

                        {!newPeerResult ? (
                            <div className="space-y-md">
                                {/* Step 1: Name */}
                                <div>
                                    <label className="label">Nome do Dispositivo</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Ex: iPhone Kaio"
                                        value={newPeerName}
                                        onChange={e => setNewPeerName(e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-end pt-md">
                                    <button onClick={handleAddPeer} disabled={!newPeerName || actionLoading} className="btn btn-primary w-full">
                                        {actionLoading ? 'Gerando Configuração...' : 'Gerar QR Code'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-md">
                                {/* Step 2: QR Code */}
                                <div className="p-md bg-white rounded-lg inline-block">
                                    <img src={newPeerResult.qr_code} alt="VPN Config" className="max-w-[250px]" />
                                </div>

                                <div>
                                    <h3 className="font-bold text-lg text-success mb-xs flex items-center justify-center gap-xs">
                                        <CheckCircle size={20} />
                                        Configuração Gerada!
                                    </h3>
                                    <p className="text-sm text-secondary">
                                        Abra o app WireGuard no celular e escaneie este código.
                                    </p>
                                    <p className="text-xs font-mono mt-sm text-muted bg-bg-dark p-xs rounded">
                                        IP Atribuído: {newPeerResult.ip}
                                    </p>
                                </div>

                                <button onClick={() => { setShowAddModal(false); setNewPeerResult(null); }} className="btn btn-secondary w-full">
                                    Concluir
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
