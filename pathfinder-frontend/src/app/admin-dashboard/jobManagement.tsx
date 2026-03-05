'use client'

import React, { useState } from 'react';
// Updated imports to use the single widgets file
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Badge, Tabs, TabsContent, TabsList, TabsTrigger, Alert, AlertDescription } from '@/app/components/globalComponents';
import { Upload, RefreshCw, FileSpreadsheet, Server, CheckCircle2, AlertCircle, Lightbulb, Plus, ExternalLink } from 'lucide-react';
import fastAxiosInstance from '@/axiosConfig/axiosfig';

interface JobSource {
  id: string;
  name: string;
  url: string;
  lastPull: Date;
  jobCount: number;
  status: 'active' | 'error' | 'pending';
}

interface CareerInsightDraft {
  title: string;
  category: string;
  excerpt: string;
  content: string;
  articleLink: string;
  image?: File | null;
}

export default function AdminJobManagement() {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [insightDraft, setInsightDraft] = useState<CareerInsightDraft>({ title: '', category: '', excerpt: '', content: '', articleLink: '', image: null });
  const [contentType, setContentType] = useState<'content' | 'link'>('content');
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'success'>('idle');
  const [uploadResult, setUploadResult] = useState<{jobs_added: number; jobs_skipped: number; errors: string[]} | null>(null); // store response from backend to indicate how many jobs were added, skipped

  const [sources, setSources] = useState<JobSource[]>([
    { id: '1', name: 'LinkedIn Jobs API', url: 'https://api.linkedin.com/jobs', lastPull: new Date('2026-01-27T08:00:00'), jobCount: 234, status: 'active' },
    { id: '2', name: 'Indeed Scraper', url: 'https://indeed.com/jobs', lastPull: new Date('2026-01-27T07:30:00'), jobCount: 189, status: 'active' },
    { id: '3', name: 'Wellfound API', url: 'https://api.wellfound.com/v1/jobs', lastPull: new Date('2026-01-27T06:00:00'), jobCount: 67, status: 'active' },
    { id: '4', name: 'Company Website Crawler', url: 'https://crawler.canworks.com', lastPull: new Date('2026-01-26T22:00:00'), jobCount: 145, status: 'error' },
  ]);
  const [repullingSources, setRepullingSources] = useState<Set<string>>(new Set());

  // Actions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('idle');
    }
  };

  // async await function because must wait for server to respond 
  const handleUploadViaUI = async () => {
    if (!selectedFile) return;
    setUploadStatus('uploading');
    setUploadResult(null);

    try {
      // FormData is browser's built-in way to send files over HTTP
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fastAxiosInstance.post('/api/upload-jobs', formData); // invoke the upload endpoint by sending the POST req
      setUploadResult(response.data);
      setUploadStatus('success');
    } catch (error) {
      setUploadStatus('error');
    }
  };

  const handleSFTPUpload = () => {
    setUploadStatus('uploading');
    setTimeout(() => {
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }, 3000);
  };

  const handleRepull = (sourceId: string) => {
    setRepullingSources(prev => new Set(prev).add(sourceId));
    setTimeout(() => {
      setSources(prev => prev.map(source => source.id === sourceId ? { ...source, lastPull: new Date(), status: 'active' as const } : source));
      setRepullingSources(prev => {
        const next = new Set(prev);
        next.delete(sourceId);
        return next;
      });
    }, 2000);
  };

  const handlePublishInsight = async () => {
    setPublishStatus('publishing');

    try {
      let imageUrl = '';
      
      // Upload image first if there is one
      if (insightDraft.image) {
        const formData = new FormData();
        formData.append('file', insightDraft.image);
        
        const uploadResponse = await fastAxiosInstance.post('/api/upload-career-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        imageUrl = uploadResponse.data.url;
      }
      
      // Create career insight with the image URL
      await fastAxiosInstance.post('/api/create-career-insights', {
        title: insightDraft.title,
        category: insightDraft.category,
        excerpt: insightDraft.excerpt,
        content: insightDraft.content,
        articleLink: insightDraft.articleLink,
        imageUrl: imageUrl,
        readTime: '5 min read', // You can calculate or add an input for this
      });
      
      setPublishStatus('idle');
      setInsightDraft({ title: '', category: '', excerpt: '', content: '', articleLink: '', image: null });
      setContentType('content');
    } catch (error) {
      console.error('Error publishing insight:', error);
      setPublishStatus('idle');
    }
  };

  // Helpers
  const formatDateTime = (date: Date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);

  const getStatusBadge = (status: JobSource['status']) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  return (
    <Tabs defaultValue="upload" className="space-y-6">
      {/* Updated TabsList to be cleaner without grid constraints */}
      <TabsList className="mb-6">
        <TabsTrigger value="upload" className="flex items-center gap-2"><Upload className="w-4 h-4" />Upload Jobs</TabsTrigger>
        <TabsTrigger value="sources" className="flex items-center gap-2"><Server className="w-4 h-4" />Job Sources</TabsTrigger>
        <TabsTrigger value="insights" className="flex items-center gap-2"><Lightbulb className="w-4 h-4" />Career Insights</TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" />Upload Spreadsheet</CardTitle>
            <CardDescription>Upload a CSV or Excel file containing job postings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Select File</Label>
              <Input id="file-upload" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="mt-2" />
              {selectedFile && <p className="text-sm text-gray-600 mt-2">Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)</p>}
            </div>

            {uploadStatus === 'success' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Upload complete! {uploadResult?.jobs_added} jobs added,
                  {uploadResult?.jobs_skipped} jobs skipped.
                  {uploadResult?.errors && uploadResult.errors.length > 0 && (
                    <span>{uploadResult.errors.length} rows had errors.</span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {uploadStatus === 'error' && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">Upload failed. Please check the file format and try again.</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleUploadViaUI} disabled={!selectedFile || uploadStatus === 'uploading'} className="w-full">
              {uploadStatus === 'uploading' ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4 mr-2" />Upload File</>}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sources" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Job Data Sources</CardTitle>
                <CardDescription className="mt-2">Manage and refresh job data from external sources</CardDescription>
              </div>
              <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" />Add Source</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sources.map((source) => (
                <div key={source.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{source.name}</h3>
                        {getStatusBadge(source.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <ExternalLink className="w-3 h-3" />
                        <span className="break-all">{source.url}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Last pull: {formatDateTime(source.lastPull)}</span>
                        <span>•</span>
                        <span>{source.jobCount} jobs collected</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleRepull(source.id)} disabled={repullingSources.has(source.id)}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${repullingSources.has(source.id) ? 'animate-spin' : ''}`} />
                        {repullingSources.has(source.id) ? 'Pulling...' : 'Repull'}
                      </Button>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="insights" className="space-y-6">
        <Card>
            <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="w-5 h-5" />Create Career Insight</CardTitle>
            <CardDescription>Publish helpful career advice and guidance for students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div>
                <Label htmlFor="insight-title">Title</Label>
                <Input id="insight-title" placeholder="e.g., How to Ace Your Technical Interview" value={insightDraft.title} onChange={(e) => setInsightDraft({ ...insightDraft, title: e.target.value })} className="mt-2" />
            </div>
            <div>
                <Label htmlFor="insight-category">Category</Label>
                <Input id="insight-category" placeholder="e.g., Interview Tips, Resume Tips" value={insightDraft.category} onChange={(e) => setInsightDraft({ ...insightDraft, category: e.target.value })} className="mt-2" />
            </div>
            <div>
                <Label htmlFor="insight-image">Featured Image</Label>
                {!insightDraft.image ? (
                  <div className="mt-2">
                    <Input 
                      id="insight-image" 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setInsightDraft({ ...insightDraft, image: file });
                        }
                      }} 
                      className="hidden" 
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => document.getElementById('insight-image')?.click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-700">{insightDraft.image.name}</span>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm"
                      onClick={() => setInsightDraft({ ...insightDraft, image: null })}
                    >
                      Remove
                    </Button>
                  </div>
                )}
            </div>
            <div>
                <Label htmlFor="insight-excerpt">Excerpt</Label>
                <Textarea id="insight-excerpt" placeholder="Brief summary (150-200 characters)" value={insightDraft.excerpt} onChange={(e) => setInsightDraft({ ...insightDraft, excerpt: e.target.value })} className="mt-2 resize-none" rows={3} />
            </div>
            <div>
                <Label>Content Type</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="contentType" 
                      value="content"
                      checked={contentType === 'content'}
                      onChange={() => {
                        setContentType('content');
                        setInsightDraft({...insightDraft, articleLink: ''});
                      }}
                    />
                    Write Content
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="contentType" 
                      value="link"
                      checked={contentType === 'link'}
                      onChange={() => {
                        setContentType('link');
                        setInsightDraft({...insightDraft, content: ''});
                      }}
                    />
                    External Article Link
                  </label>
                </div>
            </div>
            {contentType === 'content' ? (
              <div>
                  <Label htmlFor="insight-content">Content</Label>
                  <Textarea id="insight-content" placeholder="Full article content" value={insightDraft.content} onChange={(e) => setInsightDraft({ ...insightDraft, content: e.target.value })} className="mt-2 resize-none" rows={12} />
              </div>
            ) : (
              <div>
                  <Label htmlFor="insight-link">Article Link</Label>
                  <Input id="insight-link" type="url" placeholder="https://example.com/article" value={insightDraft.articleLink} onChange={(e) => setInsightDraft({ ...insightDraft, articleLink: e.target.value })} className="mt-2" />
              </div>
            )}
            <div className="flex gap-2">
                <Button onClick={handlePublishInsight} disabled={!insightDraft.title || publishStatus === 'publishing'} className="flex-1">
                {publishStatus === 'publishing' ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Publishing...</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Publish Insight</>}
                </Button>
                <Button variant="outline" className="flex-1">Save as Draft</Button>
            </div>
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}