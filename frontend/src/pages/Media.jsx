import { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, Trash2, Sticker } from 'lucide-react';

export default function Media() {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchMedia();
    }, []);

    const fetchMedia = async () => {
        try {
            const res = await fetch('/api/media');
            const data = await res.json();
            setMedia(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching media:', error);
            setLoading(false);
        }
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        try {
            await fetch('/api/media/upload', {
                method: 'POST',
                body: formData
            });
            await fetchMedia();
        } catch (error) {
            console.error('Error uploading media:', error);
            alert('Erro ao fazer upload da mídia');
        } finally {
            setUploading(false);
        }
    };

    const deleteMedia = async (id) => {
        if (!confirm('Tem certeza que deseja remover esta mídia?')) return;

        try {
            await fetch(`/api/media/${id}`, { method: 'DELETE' });
            await fetchMedia();
        } catch (error) {
            console.error('Error deleting media:', error);
        }
    };

    if (loading) {
        return <div className="loading"><div className="animate-spin"><ImageIcon size={32} /></div></div>;
    }

    const images = media.filter(m => m.type === 'image');
    const stickers = media.filter(m => m.type === 'sticker');

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Mídia</h1>
                <p className="page-description">Gerencie imagens e figurinhas para envio</p>
            </div>

            {/* Upload Section */}
            <div className="grid grid-2 gap-lg mb-xl">
                <div className="card">
                    <h3 className="mb-md flex items-center gap-sm">
                        <ImageIcon size={20} />
                        Imagens
                    </h3>
                    <label className="btn btn-primary w-full" style={{ cursor: 'pointer' }}>
                        <Upload size={20} />
                        {uploading ? 'Enviando...' : 'Upload de Imagem'}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'image')}
                            style={{ display: 'none' }}
                            disabled={uploading}
                        />
                    </label>
                    <p className="text-secondary text-sm mt-sm">
                        Formatos aceitos: JPG, PNG, GIF, WEBP (máx. 5MB)
                    </p>
                </div>

                <div className="card">
                    <h3 className="mb-md flex items-center gap-sm">
                        <Sticker size={20} />
                        Figurinhas
                    </h3>
                    <label className="btn btn-primary w-full" style={{ cursor: 'pointer' }}>
                        <Upload size={20} />
                        {uploading ? 'Enviando...' : 'Upload de Figurinha'}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'sticker')}
                            style={{ display: 'none' }}
                            disabled={uploading}
                        />
                    </label>
                    <p className="text-secondary text-sm mt-sm">
                        Formatos aceitos: JPG, PNG, GIF, WEBP (máx. 5MB)
                    </p>
                </div>
            </div>

            {/* Images Gallery */}
            <div className="mb-xl">
                <h3 className="mb-md">Imagens ({images.length})</h3>
                {images.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <ImageIcon size={48} className="empty-state-icon" />
                            <p>Nenhuma imagem adicionada</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-4 gap-md">
                        {images.map((item) => (
                            <div key={item.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{ aspectRatio: '1', background: 'var(--color-bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img
                                        src={`/uploads/images/${item.filename}`}
                                        alt={item.filename}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <div style={{ padding: 'var(--spacing-sm)' }}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-secondary">Usado {item.usage_count}x</span>
                                        <button onClick={() => deleteMedia(item.id)} className="btn btn-danger btn-sm">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Stickers Gallery */}
            <div>
                <h3 className="mb-md">Figurinhas ({stickers.length})</h3>
                {stickers.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <Sticker size={48} className="empty-state-icon" />
                            <p>Nenhuma figurinha adicionada</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-4 gap-md">
                        {stickers.map((item) => (
                            <div key={item.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{ aspectRatio: '1', background: 'var(--color-bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img
                                        src={`/uploads/stickers/${item.filename}`}
                                        alt={item.filename}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 'var(--spacing-sm)' }}
                                    />
                                </div>
                                <div style={{ padding: 'var(--spacing-sm)' }}>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-secondary">Usado {item.usage_count}x</span>
                                        <button onClick={() => deleteMedia(item.id)} className="btn btn-danger btn-sm">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
