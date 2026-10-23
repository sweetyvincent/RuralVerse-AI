import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { aiService } from '../../services/ai';
import { DocumentItem } from '../../types';
import { FileText, Upload, RefreshCw, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export const KnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [indexingId, setIndexingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = () => {
    aiService.getKnowledgeDocuments()
      .then(setDocuments)
      .catch((err) => console.log('Error loading knowledge documents:', err));
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    setMessage(null);
    setError(null);
    try {
      await aiService.uploadKnowledgeDocument(selectedFile);
      setMessage(`Document "${selectedFile.name}" uploaded. Click "Index Passages" to extract semantic chunks.`);
      setSelectedFile(null);
      loadDocuments();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleIndex = async (docId: number) => {
    setIndexingId(docId);
    setMessage(null);
    setError(null);
    try {
      const res = await aiService.indexDocument(docId);
      setMessage(res.message);
      loadDocuments();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Indexing failed.');
    } finally {
      setIndexingId(null);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!confirm('Delete this knowledge document and its indexed semantic chunks?')) return;
    try {
      await aiService.deleteDocument(docId);
      setMessage('Document removed from knowledge base.');
      loadDocuments();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Delete failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">RAG Knowledge Base & Reference PDFs</h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload government textbooks, lesson PDFs, and reference papers for semantic chunking and verified student retrieval.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Box */}
        <Card className="lg:col-span-1 p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyan-400" /> Upload Textbook PDF
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer"
            />
            <Button
              type="submit"
              variant="glow"
              size="sm"
              className="w-full"
              disabled={!selectedFile || uploading}
              loading={uploading}
            >
              Upload Document
            </Button>
          </form>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Supported formats: PDF, TXT. Documents undergo text extraction, overlapping chunking, and semantic token indexing.
          </p>
        </Card>

        {/* Uploaded Documents List */}
        <Card className="lg:col-span-2 p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Indexed Reference Documents ({documents.length})
          </h2>

          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div>
                      <h4 className="font-bold text-white">{doc.title}</h4>
                      <p className="text-[10px] text-slate-500">
                        Size: {Math.round((doc.file_size || 0) / 1024)} KB • Status:{' '}
                        <span className={doc.status === 'indexed' ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                          {doc.status.toUpperCase()}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {doc.status !== 'indexed' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleIndex(doc.id)}
                        loading={indexingId === doc.id}
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Index Passages
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleIndex(doc.id)}
                        loading={indexingId === doc.id}
                      >
                        Re-index
                      </Button>
                    )}

                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-slate-500">
              No textbook PDFs uploaded yet. Upload your first document using the form on the left.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
