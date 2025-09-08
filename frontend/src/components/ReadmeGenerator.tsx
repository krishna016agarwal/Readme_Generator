import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Download, 
  ExternalLink, 
  Github, 
  Star, 
  GitFork,
  FileText,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RepoMetadata {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  license: string;
  topics: string[];
  lastUpdated: string;
}

interface GenerateResponse {
  generatedReadme: string;
  meta: RepoMetadata;
}

const ReadmeGenerator: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [generatedReadme, setGeneratedReadme] = useState('');
  const [repoMetadata, setRepoMetadata] = useState<RepoMetadata | null>(null);
  const [error, setError] = useState('');
  const [options, setOptions] = useState({
    includeExistingReadme: true,
    limitFileParsing: false,
    includeContributors: true
  });
  
  const { toast } = useToast();

  const isValidGithubUrl = (url: string): boolean => {
    const githubUrlPattern = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;
    return githubUrlPattern.test(url);
  };

  const handleGenerate = async () => {
    if (!isValidGithubUrl(repoUrl)) {
      setError('Please enter a valid GitHub repository URL');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Build API URL safely: in production (Vercel), always use same-origin serverless API
      // In local dev, allow overriding with VITE_BACKEND_LINK (e.g., http://localhost:5000)
      const backendBase = (import.meta as any).env?.VITE_BACKEND_LINK as string | undefined;
      const isBrowser = typeof window !== 'undefined';
      const isLocalhost = isBrowser && /localhost|127\.0\.0\.1/.test(window.location.origin);
      const base = isLocalhost && backendBase ? backendBase.replace(/\/+$/, '') : '';
      const apiUrl = base ? `${base}/api/generate-readme` : '/api/generate-readme';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoUrl,
          options
        }),
      });

      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Repository not found' : 'Failed to generate README');
      }

      const data: GenerateResponse = await response.json();
      setGeneratedReadme(data.generatedReadme);
      setRepoMetadata(data.meta);
      
      toast({
        title: "README Generated Successfully!",
        description: "Your professional README.md is ready.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      toast({
        title: "Generation Failed",
        description: "Please check the repository URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedReadme);
    toast({
      title: "Copied to clipboard!",
      description: "README markdown has been copied.",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([generatedReadme], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "README.md file has been downloaded.",
    });
  };

  const handleOpenRaw = () => {
    const blob = new Blob([generatedReadme], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative container mx-auto px-4 py-16 sm:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6">
              <Github className="w-8 h-8 text-primary" />
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 text-gradient">
              Public Repository README Generator
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Paste a GitHub repo URL to auto-create a professional README.md
            </p>
            <Badge variant="time" className="mb-8">
              <Clock className="w-3 h-3 mr-1" />
              ≈ 1-2 minutes
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Input Section */}
          <Card className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Repository URL</CardTitle>
              <CardDescription>
                Enter the GitHub repository URL you want to generate a README for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Input
                  type="url"
                  placeholder="https://github.com/owner/repo"
                  value={repoUrl}
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                    setError('');
                  }}
                  className={`glass text-lg ${error ? 'border-destructive' : ''}`}
                />
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>

              {/* Advanced Options */}
              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    Advanced Options
                    {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="existing-readme"
                        checked={options.includeExistingReadme}
                        onCheckedChange={(checked) => 
                          setOptions(prev => ({ ...prev, includeExistingReadme: !!checked }))
                        }
                      />
                      <label htmlFor="existing-readme" className="text-sm font-medium">
                        Include existing README preview
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="limit-parsing"
                        checked={options.limitFileParsing}
                        onCheckedChange={(checked) => 
                          setOptions(prev => ({ ...prev, limitFileParsing: !!checked }))
                        }
                      />
                      <label htmlFor="limit-parsing" className="text-sm font-medium">
                        Limit file parsing (fast)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-contributors"
                        checked={options.includeContributors}
                        onCheckedChange={(checked) => 
                          setOptions(prev => ({ ...prev, includeContributors: !!checked }))
                        }
                      />
                      <label htmlFor="include-contributors" className="text-sm font-medium">
                        Include contributors
                      </label>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Button 
                onClick={handleGenerate} 
                disabled={!repoUrl || isLoading}
                className="w-full text-lg h-12"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating README...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate README
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <Card className="glass-card mb-8">
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <div className="animate-pulse-glow">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                  </div>
                  <p className="text-lg text-muted-foreground">Generating README...</p>
                  <div className="space-y-2 max-w-md mx-auto">
                    <div className="h-2 bg-muted rounded animate-pulse" />
                    <div className="h-2 bg-muted rounded animate-pulse w-3/4 mx-auto" />
                    <div className="h-2 bg-muted rounded animate-pulse w-1/2 mx-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Section */}
          {generatedReadme && !isLoading && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* README Preview */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                      <CardTitle className="text-xl">README Preview</CardTitle>
                      <CardDescription>Generated markdown content</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={handleCopy} variant="icon" size="icon">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button onClick={handleDownload} variant="icon" size="icon">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button onClick={handleOpenRaw} variant="icon" size="icon">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={generatedReadme}
                      readOnly
                      className="font-mono text-sm min-h-[600px] glass resize-none"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Metadata Sidebar */}
              <div className="space-y-6">
                {repoMetadata && (
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-lg">Repository Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">PROJECT</h4>
                        <p className="font-medium">{repoMetadata.name}</p>
                        <p className="text-sm text-muted-foreground">{repoMetadata.description}</p>
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm">{repoMetadata.stars}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <GitFork className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{repoMetadata.forks}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">LANGUAGE</h4>
                        <Badge variant="language">{repoMetadata.language}</Badge>
                      </div>

                      {repoMetadata.license && (
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-2">LICENSE</h4>
                          <Badge variant="repo">{repoMetadata.license}</Badge>
                        </div>
                      )}

                      {repoMetadata.topics.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm text-muted-foreground mb-2">TOPICS</h4>
                          <div className="flex flex-wrap gap-1">
                            {repoMetadata.topics.map((topic) => (
                              <Badge key={topic} variant="repo" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3 h-3 text-success" />
                          Generated successfully
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!generatedReadme && !isLoading && !error && (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Github className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Ready to Generate</h3>
                <p className="text-muted-foreground">
                  Enter a GitHub repository URL above to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReadmeGenerator;